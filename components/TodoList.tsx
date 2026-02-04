"use client";

import { useState } from "react";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

interface TodoListProps {
  initialTodos?: string[];
}

const TodoList = ({ initialTodos = [] }: TodoListProps) => {
  const [todos, setTodos] = useState<Todo[]>(
    initialTodos.map((text, id) => ({ id, text, completed: false }))
  );
  const [input, setInput] = useState("");

  const addTodo = () => {
    if (input.trim()) {
      setTodos([
        ...todos,
        { id: Date.now(), text: input.trim(), completed: false },
      ]);
      setInput("");
    }
  };

  const toggleTodo = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-md">
      <h3 className="mb-4 text-lg font-semibold">Todo List</h3>
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && addTodo()}
          placeholder="Add a todo..."
          className="flex-1 rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
        />
        <button
          onClick={addTodo}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Add
        </button>
      </div>
      <div className="space-y-2">
        {todos.length === 0 ? (
          <p className="text-gray-500">No todos yet. Add one above!</p>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              className="flex items-center gap-2 rounded border border-gray-200 p-2"
            >
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
                className="h-4 w-4"
              />
              <span
                className={`flex-1 ${todo.completed ? "line-through text-gray-400" : ""}`}
              >
                {todo.text}
              </span>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="rounded bg-red-500 px-2 py-1 text-sm text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
      {todos.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          {todos.filter((t) => !t.completed).length} of {todos.length} remaining
        </div>
      )}
    </div>
  );
};

export default TodoList;
