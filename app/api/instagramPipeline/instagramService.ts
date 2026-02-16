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

export async function runInstagramScraper({
  apiToken,
  instagramUrl,
}: InstagramScraperInput): Promise<any[]> {
  console.log("🚀 Starting Instagram scraper...");

  //run scraper
  const runResponse = await fetch(
    `https://api.apify.com/v2/acts/apify~instagram-scraper/runs?token=${apiToken}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        directUrls: [instagramUrl],
        resultsType: "details", // Get full profile information
        resultsLimit: 1,
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
      `Failed to start Instagram scraper: ${errorMessage} (Status: ${runResponse.status})`
    );
  }

  const runData: ApifyRunResponse = await runResponse.json();

  if (!runData?.data?.id) {
    throw new Error(
      "Invalid API response: missing run ID in response from Apify"
    );
  }

  const runId = runData.data.id;
  console.log(`Scraper started (Run ID: ${runId})`);

  // Wait for scraper to finish
  console.log("Waiting for scraper to complete");

  let finishedRunData: ApifyFinishedRunResponse | null = null;
  const maxAttempts = 60; // 60 attempts * 5 seconds = 5 minutes max
  const pollInterval = 5000; // 5 seconds

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
        `Error checking scraper status: ${errorMessage} (Status: ${statusResponse.status})`
      );
    }

    const statusData: ApifyFinishedRunResponse = await statusResponse.json();
    const status = statusData.data.status;

    if (status === "SUCCEEDED") {
      finishedRunData = statusData;
      console.log(` Scraper completed successfully`);
      break;
    } else if (status === "FAILED" || status === "ABORTED" || status === "TIMED-OUT") {
      throw new Error(`Scraper failed with status: ${status}`);
    } else {
      if (attempt % 6 === 0) {
        console.log(`  Still running. (${attempt * pollInterval / 1000}s elapsed)`);
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }

  if (!finishedRunData) {
    throw new Error(
      "Scraper timed out after 5 minutes. Check Apify."
    );
  }

  if (!finishedRunData?.data?.defaultDatasetId) {
    throw new Error(
      "Invalid API response: missing dataset ID in finished run response"
    );
  }

  const datasetId = finishedRunData.data.defaultDatasetId;
  const runStatus = finishedRunData.data.status;
  console.log(`Scraper completed with status: ${runStatus}`);

  // Fetch data
  console.log("Fetching scraped data");

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
      `Failed to fetch dataset items: ${errorMessage} (Status: ${datasetResponse.status})`
    );
  }

  const rawData: any[] = await datasetResponse.json();

  if (!Array.isArray(rawData)) {
    throw new Error("Invalid API response: expected array of items");
  }

  console.log(`Retrieved ${rawData.length} items from dataset`);

  return rawData;
}
