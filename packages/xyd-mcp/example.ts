#!/usr/bin/env bun

import { XydMcpClient } from "./client.js";

async function main() {
  console.log("🚀 Starting XYD MCP Client Example\n");
  console.log("Make sure your MCP server is running on http://localhost:3000");
  console.log("You can start it with: bun run dev\n");

  // You can also use the client directly like this:
  console.log("\n--- Advanced Usage Example ---");
  
  const client = new XydMcpClient();
  
  try {
    await client.connect();
    
    // Multiple calculations
    const calculations = ["2 + 2", "10 * 5", "100 / 4", "Math.sqrt(16)"];
    
    console.log("\n🧮 Running multiple calculations:");
    for (const expr of calculations) {
      await client.callTool("calculate", { expression: expr });
    }
    
    // Multiple weather requests
    const cities = ["London", "Tokyo", "Sydney", "San Francisco"];
    
    console.log("\n🌍 Getting weather for multiple cities:");
    for (const city of cities) {
      await client.callTool("get_weather", { city });
    }
    
  } catch (error) {
    console.error("❌ Advanced example failed:", error);
  } finally {
    await client.disconnect();
  }
}

if (import.meta.main) {
  main().catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  });
}
