import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import * as csv from "csv-parse/sync";
import axios from "axios";
import * as cheerio from "cheerio";

const s3 = new S3Client({});
const dynamo = new DynamoDBClient({});

interface Candidate {
  url: string;
  name?: string;
  title?: string;
  location?: string;
  summary?: string;
}

export const handler = async (event: any) => {
  console.log("Event:", JSON.stringify(event));

  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

    // 1. fetch CSV file from S3
    const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const body = await obj.Body?.transformToString();
    if (!body) throw new Error("Empty CSV");

    const rows: string[][] = csv.parse(body.trim(), { relax_column_count: true });
    const urls = rows.map((r) => r[0]).filter(Boolean);

    for (const url of urls) {
      const candidate: Candidate = { url };
      try {
        // 2. Fetch public LinkedIn profile page
        const { data: html } = await axios.get(url, {
          headers: {
            // Minimal headers to look like a browser
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
          },
        });

        // 3. Parse with cheerio – works for public pages (no auth)
        const $ = cheerio.load(html);
        candidate.name = $('meta[property="og:title"]').attr("content")?.split(" - ")[0]?.trim();
        candidate.title = $('meta[property="og:title"]').attr("content")?.split(" - ").slice(1).join(" - ");
        candidate.location = $('span.top-card__subline-item').first().text().trim() || undefined;
        candidate.summary = $('meta[name="description"]').attr("content")?.trim();
      } catch (err) {
        console.warn(`Failed to scrape ${url}:`, err);
      }

      // 4. Store in DynamoDB table `CandidateProfiles`
      const item: any = {
        pk: { S: candidate.url },
        name: { S: candidate.name || "" },
        title: { S: candidate.title || "" },
        location: { S: candidate.location || "" },
        summary: { S: candidate.summary || "" },
        scrapedAt: { S: new Date().toISOString() },
      };

      await dynamo.send(
        new PutItemCommand({
          TableName: process.env.CANDIDATE_TABLE || "CandidateProfiles",
          Item: item,
        })
      );
    }
  }

  return { statusCode: 200 };
}; 