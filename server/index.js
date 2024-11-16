// Import necessary modules
const express = require("express");
const puppeteer = require("puppeteer"); 
const cors = require("cors");

const app = express();

// Configure CORS to allow requests from specific origin
app.use(
  cors({
    origin: "http://localhost:5173", // Only allow requests from this origin
    methods: ["GET", "POST"], // Allowed HTTP methods
    allowedHeaders: ["Content-Type"], // Allowed headers
  })
);

// Middleware to parse JSON data from incoming requests
app.use(express.json());

// POST endpoint to analyze text content from a URL
app.post("/analyze", async (req, res) => {
  const { url, n, stopWords = [] } = req.body; // Destructure URL, top N words, and optional stopWords from request body

  // Validate URL format using a regular expression pattern
  const urlPattern = /^(https?|chrome):\/\/[^\s$.?#].[^\s]*$/gm;
  if (!urlPattern.test(url)) {
    return res.status(400).json({ error: "Invalid URL format" }); // Return error if URL format is invalid
  }

  let browser;
  try {
    // Launch Puppeteer in headless mode with specific configurations
    browser = await puppeteer.launch({
      headless: true, // Run in headless mode for performance
      args: ["--no-sandbox", "--disable-setuid-sandbox"], // Security flags
    });
    
    // Open a new page in the browser and navigate to the specified URL
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 }); // Wait until network is idle, with a timeout

    // Extract visible text content from the page
    const visibleTextContent = await page.evaluate(() => {
      // Helper function to check if an element is visible
      const isVisible = (element) => {
        const style = window.getComputedStyle(element);
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          style.opacity !== "0"
        );
      };

      // Initialize an empty string to accumulate visible text content
      let textContent = "";
      document.querySelectorAll("body *").forEach((element) => {
        if (isVisible(element) && element.childElementCount === 0) { // Check visibility and if element has no child elements
          const text = element.innerText ? element.innerText.trim() : "";
          if (text) textContent += " " + text; // Append text if present
        }
      });

      // Return the combined text content with extra whitespace removed
      return textContent.replace(/\s+/g, " ").trim();
    });

    // Remove unwanted HTML-like structures from the extracted text content
    const refinedText = visibleTextContent
      .replace(/<[^>]*>/g, "") // Remove HTML tags
      .replace(/\b(?:width|px|img|decoding|async|class|size|src|srcset|alt|vw|height|sizes|max-width)\b=[^ ]*\s*/gi, "") // Remove specific attributes
      .replace(/\s+/g, " ") // Collapse multiple spaces
      .trim();

    // Get the top N most frequent words, excluding stop words
    const topWords = getTopWords(refinedText, n, stopWords);
    res.json(topWords); // Send the top words as JSON response

  } catch (error) {
    console.error("Error fetching or processing page content:", error.message);
    res.status(500).json({ error: "Failed to fetch or process the page content" }); // Return error if any issues occur
  } finally {
    // Close the browser to free up resources
    if (browser) await browser.close();
  }
});

// Helper function to calculate the top N frequent words from text
function getTopWords(text, n, additionalStopWords) {
  // Default list of common stop words
  const defaultStopWords = [
    "the", "and", "is", "to", "in", "it", "that", "of", "a", "an", "for", "on", "with",
    "as", "by", "at", "this", "be", "or", "not", "are", "from", "was", "were", "but"
  ];
  
  // Combine default and additional stop words, converting to lowercase
  const stopWords = new Set([...defaultStopWords, ...additionalStopWords.map(word => word.toLowerCase())]);

  const wordCounts = {}; // Object to store word frequency

  // Remove non-alphabet characters and convert to lowercase
  const cleanedText = text.replace(/[^a-zA-Z\s]/g, "").toLowerCase().trim();

  // Split text into words and count each word that isn't a stop word
  cleanedText.split(/\s+/).forEach((word) => {
    if (word && !stopWords.has(word)) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    }
  });

  // Convert word counts to an array of objects, sorted by frequency in descending order
  return Object.entries(wordCounts)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n); // Take only the top N words
}

// Start the Express server on port 5000
app.listen(5000, () => {
  console.log("Server is running on http://localhost:5000");
});


