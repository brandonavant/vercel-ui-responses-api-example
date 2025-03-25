import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
export const runtime = 'edge';

const openai: OpenAI = new OpenAI();
const VECTOR_STORE_NAME: string = "vs-vercel-ui-responses-api-example";

async function initVectorStore(): Promise<OpenAI.VectorStores.VectorStore> {
  const vectorStoreList: OpenAI.VectorStores.VectorStoresPage = await openai.vectorStores.list();
  let vectorStore: OpenAI.VectorStores.VectorStore | undefined = vectorStoreList.data.find(
    store => store.name === VECTOR_STORE_NAME
  );

  if (!vectorStore) {
    vectorStore = await openai.vectorStores.create({
      name: VECTOR_STORE_NAME,
    });
  }

  return vectorStore;
}

export async function POST(req: NextRequest) {
  try {

    const formData = await req.formData();
    const files = formData.getAll('files');

    const vectorStore = await initVectorStore();

    const processedFiles = Promise.all(files.map(async (file: FormDataEntryValue, index: number) => {
      if (!(file instanceof File)) {
        throw new Error(`Item at index ${index} is not a file`);
      }

      const fileUploadResult: OpenAI.Files.FileObject = await openai.files.create({
        file: file,
        purpose: "assistants"
      });

      await openai.vectorStores.files.create(vectorStore.id, {
        file_id: fileUploadResult.id
      });

      return {
        id: fileUploadResult.id,
        name: file.name,
        size: file.size,
        type: file.type
      };
    }));

    return NextResponse.json({
      success: true,
      files: processedFiles
    });

  } catch (error) {
    console.error('Error processing files:', error);
    return NextResponse.json(
      { error: "There was an error processing your files" },
      { status: 500 }
    );
  }
}