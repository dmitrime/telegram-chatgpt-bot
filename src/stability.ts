export namespace StabilityAI {
  interface GenerationResponse {
    artifacts: Array<{
      base64: string;
      seed: number;
      finishReason: string;
    }>;
  }

  function randomString(len = 8): string {
    return Array.from({ length: len }, () =>
      ((Math.random() * 36) | 0).toString(36)
    ).join("");
  }

  function base64Decode(encodedString: string): ArrayBuffer {
    const decodedString = atob(encodedString);
    return new Uint8Array(
      Array.from(decodedString, (char) => char.charCodeAt(0))
    ).buffer;
  }

  export async function generatePictures(
    apiKey: string,
    bucket: R2Bucket,
    prompt: string,
    user: string
  ): string[] {
    const model = "stable-diffusion-xl-beta-v2-2-2";

    const response = await fetch(
      `https://api.stability.ai/v1/generation/${model}/text-to-image`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          text_prompts: [
            {
              text: prompt,
            },
          ],
          height: 512,
          width: 512,
          samples: 1,
          steps: 30,
        }),
      }
    );
    if (!response.ok) {
      throw new Error(
        `StabilityAI API returned ${response.status}: ${response.message}`
      );
    }

    const responseJSON = (await response.json()) as GenerationResponse;
    const name = randomString();
    return await Promise.all(
      responseJSON.artifacts
        .filter((art) => art.finishReason === "SUCCESS")
        .map(async (image, index) => {
          const object = await bucket.put(
            `${user}/stability_${name}_${index}.png`,
            base64Decode(image.base64)
          );
          return object.key;
        })
    );
  }
}
