type InstagramScraperInput = {
  apiToken: string;
  instagramUrl: string;
};

interface ApifyRunResponse {
  data: {
    id: string;
    status?: string;
  };
}

interface ApifyFinishedRunResponse {
  data: {
    id: string;
    status: string;
    defaultDatasetId: string;
  };
}

interface ApifyErrorResponse {
  error?: {
    message: string;
    type: string;
  };
}

export interface InstagramScraperResult {
  profile: any[];
  posts: any[];
}

// Scraping function
async function runApifyScraper(
  apiToken: string,
  instagramUrl: string,
  resultsType: string,
  resultsLimit: number,
  label: string
): Promise<any[]> {
  console.log(`\n[${label}] Starting scrape (${resultsType})...`);

  const runResponse = await fetch(
    `https://api.apify.com/v2/acts/apify~instagram-scraper/runs?token=${apiToken}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        directUrls: [instagramUrl],
        resultsType,
        resultsLimit,
      }),
    }
  );

  if (!runResponse.ok) {
    const errorData: ApifyErrorResponse = await runResponse
      .json()
      .catch(() => ({}));
    const errorMessage =
      errorData.error?.message || `HTTP ${runResponse.status}`;
    throw new Error(
      `[${label}] Failed to start scraper: ${errorMessage} (Status: ${runResponse.status})`
    );
  }

  const runData: ApifyRunResponse = await runResponse.json();

  if (!runData?.data?.id) {
    throw new Error(
      `[${label}] Invalid API response: missing run ID`
    );
  }

  const runId = runData.data.id;
  console.log(`[${label}] Scraper started (Run ID: ${runId})`);
  console.log(`[${label}] Waiting for scraper to complete...`);

  // Poll for completion
  let finishedRunData: ApifyFinishedRunResponse | null = null;
  const maxAttempts = 60;
  const pollInterval = 5000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const statusResponse = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${apiToken}`
    );

    if (!statusResponse.ok) {
      const errorData: ApifyErrorResponse = await statusResponse
        .json()
        .catch(() => ({}));
      const errorMessage =
        errorData.error?.message || `HTTP ${statusResponse.status}`;
      throw new Error(
        `[${label}] Error checking status: ${errorMessage} (Status: ${statusResponse.status})`
      );
    }

    const statusData: ApifyFinishedRunResponse = await statusResponse.json();
    const status = statusData.data.status;

    if (status === "SUCCEEDED") {
      finishedRunData = statusData;
      console.log(`[${label}] Scraper completed successfully`);
      break;
    } else if (status === "FAILED" || status === "ABORTED" || status === "TIMED-OUT") {
      throw new Error(`[${label}] Scraper failed with status: ${status}`);
    } else {
      if (attempt % 6 === 0) {
        console.log(`[${label}] Still running... (${attempt * pollInterval / 1000}s elapsed)`);
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }

  if (!finishedRunData) {
    throw new Error(`[${label}] Scraper timed out after 5 minutes`);
  }

  if (!finishedRunData?.data?.defaultDatasetId) {
    throw new Error(`[${label}] Invalid API response: missing dataset ID`);
  }

  const datasetId = finishedRunData.data.defaultDatasetId;

  // Fetch dataset
  console.log(`[${label}] Fetching scraped data...`);

  const datasetResponse = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apiToken}&clean=false`
  );

  if (!datasetResponse.ok) {
    const errorData: ApifyErrorResponse = await datasetResponse
      .json()
      .catch(() => ({}));
    const errorMessage =
      errorData.error?.message || `HTTP ${datasetResponse.status}`;
    throw new Error(
      `[${label}] Failed to fetch dataset: ${errorMessage} (Status: ${datasetResponse.status})`
    );
  }

  const rawData: any[] = await datasetResponse.json();

  if (!Array.isArray(rawData)) {
    throw new Error(`[${label}] Invalid API response: expected array`);
  }

  console.log(`[${label}] Retrieved ${rawData.length} items`);

  return rawData;
}

export async function runInstagramScraper({
  apiToken,
  instagramUrl,
}: InstagramScraperInput): Promise<InstagramScraperResult> {
  console.log(`Starting Instagram scraper for: ${instagramUrl}`);

  // Scrape profile
  const profile = await runApifyScraper(
    apiToken, instagramUrl, "details", 1, "Profile"
  );

  // Scrape posts
  const posts = await runApifyScraper(
    apiToken, instagramUrl, "posts", 200, "Posts"
  );

  return { profile, posts };
}
