export interface Video {
  key: string;
  title: string;
  description?: string;
  thumbnailURL: string;
  embedLink: string;
  downloadLink?: string;
  category: string;
  timestamp?: number;
}

export interface Slider {
  key: string;
  thumbnailURL: string;
  clickable: string;
  clickURL?: string;
}

export interface Ad {
  key: string;
  thumbnailURL: string;
  clickURL: string;
  title?: string;
}
