"""In-memory fake of just enough Supabase client surface to test persistence.

Implements: select(...).eq().neq().is_().not_.is_().limit().execute(),
update(...).eq().execute(), insert(...).execute(),
upsert(..., on_conflict=...).execute(), delete().eq().neq().execute().

Stores rows in `tables[table_name]` as a list of dicts.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from typing import Any


@dataclass
class _Result:
    data: list[dict[str, Any]]
    count: int | None = None


@dataclass
class _Query:
    client: "FakeSupabase"
    table_name: str
    op: str  # "select" | "update" | "insert" | "upsert" | "delete"
    filters: list[tuple[str, str, Any]] = field(default_factory=list)
    payload: dict[str, Any] | None = None
    on_conflict: str | None = None
    limit_n: int | None = None

    def eq(self, column: str, value: Any) -> "_Query":
        self.filters.append(("eq", column, value))
        return self

    def neq(self, column: str, value: Any) -> "_Query":
        self.filters.append(("neq", column, value))
        return self

    def is_(self, column: str, value: Any) -> "_Query":
        # Supabase's `.is_("col", "null")` corresponds to IS NULL.
        self.filters.append(("is_", column, value))
        return self

    @property
    def not_(self) -> "_NotProxy":
        return _NotProxy(self)

    def limit(self, n: int) -> "_Query":
        self.limit_n = n
        return self

    def _matches(self, row: dict[str, Any]) -> bool:
        for op, column, value in self.filters:
            if op == "eq":
                if row.get(column) != value:
                    return False
            elif op == "neq":
                if row.get(column) == value:
                    return False
            elif op == "is_":
                # Only NULL semantics are exercised by current tests.
                if str(value).lower() == "null":
                    if row.get(column) is not None:
                        return False
                elif row.get(column) != value:
                    return False
            elif op == "not_is_":
                if str(value).lower() == "null":
                    if row.get(column) is None:
                        return False
                elif row.get(column) == value:
                    return False
            else:
                raise NotImplementedError(f"filter op: {op}")
        return True

    def execute(self) -> _Result:
        rows = self.client.tables.setdefault(self.table_name, [])

        if self.op == "select":
            matched = [r for r in rows if self._matches(r)]
            if self.limit_n is not None:
                matched = matched[: self.limit_n]
            return _Result(data=matched, count=len(matched))

        if self.op == "update":
            assert self.payload is not None
            updated: list[dict[str, Any]] = []
            for r in rows:
                if self._matches(r):
                    r.update(self.payload)
                    updated.append(dict(r))
            return _Result(data=updated)

        if self.op == "insert":
            assert self.payload is not None
            new_row = dict(self.payload)
            new_row.setdefault("id", str(uuid.uuid4()))
            rows.append(new_row)
            return _Result(data=[dict(new_row)])

        if self.op == "upsert":
            assert self.payload is not None
            assert self.on_conflict is not None
            keys = [k.strip() for k in self.on_conflict.split(",")]
            existing = next(
                (r for r in rows if all(r.get(k) == self.payload.get(k) for k in keys)),
                None,
            )
            if existing is not None:
                existing.update(self.payload)
                return _Result(data=[dict(existing)])
            new_row = dict(self.payload)
            new_row.setdefault("id", str(uuid.uuid4()))
            rows.append(new_row)
            return _Result(data=[dict(new_row)])

        if self.op == "delete":
            kept: list[dict[str, Any]] = []
            removed: list[dict[str, Any]] = []
            for r in rows:
                if self._matches(r):
                    removed.append(dict(r))
                else:
                    kept.append(r)
            self.client.tables[self.table_name] = kept
            return _Result(data=removed)

        raise NotImplementedError(self.op)


@dataclass
class _NotProxy:
    query: _Query

    def is_(self, column: str, value: Any) -> _Query:
        self.query.filters.append(("not_is_", column, value))
        return self.query


@dataclass
class _TableHandle:
    client: "FakeSupabase"
    table_name: str

    def select(self, _columns: str = "*", *, count: str | None = None) -> _Query:  # noqa: ARG002
        return _Query(self.client, self.table_name, "select")

    def update(self, payload: dict[str, Any]) -> _Query:
        return _Query(self.client, self.table_name, "update", payload=payload)

    def insert(self, payload: dict[str, Any]) -> _Query:
        return _Query(self.client, self.table_name, "insert", payload=payload)

    def upsert(self, payload: dict[str, Any], *, on_conflict: str) -> _Query:
        return _Query(
            self.client,
            self.table_name,
            "upsert",
            payload=payload,
            on_conflict=on_conflict,
        )

    def delete(self) -> _Query:
        return _Query(self.client, self.table_name, "delete")


class FakeSupabase:
    def __init__(self, *, seed: dict[str, list[dict[str, Any]]] | None = None) -> None:
        self.tables: dict[str, list[dict[str, Any]]] = {}
        if seed:
            for name, rows in seed.items():
                self.tables[name] = [dict(r) for r in rows]

    def table(self, name: str) -> _TableHandle:
        return _TableHandle(self, name)
