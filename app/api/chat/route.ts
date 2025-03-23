import 'openai/shims/web';
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';

const openai = new OpenAI();

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const responseStream = await openai.responses.create({
      model: "gpt-4o",
      input: messages,
      stream: true
    });

    // Create a TransformStream to process the response events
    const encoder = new TextEncoder();
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    // Process the stream events in the background
    // Don't await this promise - it should run in parallel with the response
    // noinspection ES6MissingAwait
    (async () => {
      try {
        for await (const event of responseStream) {
          // Handle text delta events
          if (event.type === 'response.output_text.delta') {
            const text = event.delta || '';
            // noinspection ES6MissingAwait
            writer.write(encoder.encode(text));
          }
        }
      } catch (error) {
        console.error('Stream processing error:', error);
        // noinspection ES6MissingAwait
        writer.abort(error instanceof Error ? error : new Error(String(error)));
      } finally {
        // noinspection ES6MissingAwait
        writer.close();
      }
    })();

    // Return the readable stream immediately, without waiting for the processing to complete
    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: "There was an error processing your request" },
      { status: 500 }
    );
  }
}