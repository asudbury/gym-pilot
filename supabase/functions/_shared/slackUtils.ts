/**
 * Sends a message to a specified Slack channel using a configured webhook URL.
 *
 * @param channelId The ID or name of the Slack channel (e.g., "#general" or "C12345").
 * @param message The text content of the message to send.
 * @returns A promise that resolves to an object indicating success or failure, with an optional error message.
 */
export async function sendSlackMessage(channelId: string, message: string): Promise<{ success: boolean; error?: string }> {
  const slackBotToken = Deno.env.get("SLACK_BOT_TOKEN");

  if (!slackBotToken) {
    console.error("SLACK_BOT_TOKEN environment variable is not set.");
    return { success: false, error: "Slack bot token is not configured." };
  }

  try {
    const payload = { channel: channelId, text: message };
    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${slackBotToken}`,
      },
      body: JSON.stringify(payload),
    });

    const responseJson = await response.json();

    if (!response.ok || !responseJson.ok) {
      const errorMessage = responseJson.error || `HTTP error: ${response.status} ${response.statusText}`;
      console.error(`Failed to send Slack message: ${errorMessage}`);
      return { success: false, error: `Slack API error: ${errorMessage}` };
    }

    console.log(`Slack message successfully sent to ${channelId}.`);
    return { success: true };
  } catch (error) {
    console.error("Error sending Slack message:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}