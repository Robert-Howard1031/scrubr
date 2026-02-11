import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

export async function getAssetSizeBytes(asset: MediaLibrary.Asset): Promise<number> {
  try {
    const info = await MediaLibrary.getAssetInfoAsync(asset, {
      shouldDownloadFromNetwork: false,
    });
    const uri = info.localUri ?? info.uri ?? asset.uri;
    if (!uri) return 0;
    const fileInfo = await FileSystem.getInfoAsync(uri, { size: true });
    if (fileInfo.exists && typeof fileInfo.size === 'number') {
      return fileInfo.size;
    }
    return 0;
  } catch (error) {
    return 0;
  }
}
