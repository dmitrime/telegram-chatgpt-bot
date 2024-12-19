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
  ): Promise<string[]> {

    const formdata = new FormData();
    formdata.append("prompt", prompt);
    const response = await fetch(
      "https://api.stability.ai/v2beta/stable-image/generate/core",
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
        body: formdata
      }
    );

    const responseData = await response.json();
    if (response.status === 200) {
      const image = base64Decode(responseData.image);
      const name = randomString();
      const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const object = await bucket.put(`${user}/stability_${datePrefix}_${name}.png`, image);
      return [object.key];
    } else {
      throw new Error(
        `StabilityAI API returned ${response.status}: ` + JSON.stringify(responseData)
      );
    }
  }
}