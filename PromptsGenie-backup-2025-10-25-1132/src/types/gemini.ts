export interface TextPart {
  text: string;
}

export interface ImagePart {
  inlineData: {
    mimeType: string;
    data: string;
  };
}