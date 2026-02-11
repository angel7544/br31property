import * as ImagePicker from 'expo-image-picker';
// import * as FileSystem from 'expo-file-system';
// import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';

// ============================================================================
// CLOUDINARY CONFIGURATION
// ============================================================================
// We have the Cloud Name, but we are missing the "Unsigned Upload Preset".
// For direct uploads from Android to work with Cloudinary, you MUST create an 
// "Unsigned Upload Preset" in your Cloudinary Settings -> Upload.
const CLOUDINARY_CLOUD_NAME = 'dqegtnoua'; 
const CLOUDINARY_UPLOAD_PRESET = 'ml_default'; // <--- REPLACE THIS if you want to use Cloudinary

// DEFAULT: Using Supabase Storage because it's fully configured via our SQL script.
// Set this to true ONLY if you have filled in CLOUDINARY_UPLOAD_PRESET above.
const USE_CLOUDINARY = true; 

export async function pickImage(allowsMultipleSelection = false) {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection,
    quality: 0.8,
    // base64: true, // Not needed for FormData/Blob upload
  });

  if (!result.canceled) {
    return result.assets;
  }
  return null;
}

export async function uploadImage(uri: string, bucketName: string, folderPath: string = '') {
  if (USE_CLOUDINARY) {
    return uploadToCloudinary(uri, bucketName);
  } else {
    return uploadToSupabase(uri, bucketName, folderPath);
  }
}

async function uploadToCloudinary(uri: string, folder: string) {
  // Only check Cloudinary config if we are actually using it
  // if (CLOUDINARY_CLOUD_NAME === 'dqegtnoua' || CLOUDINARY_UPLOAD_PRESET === 'ml_default') {
  //    throw new Error('Cloudinary not configured. Please set CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET in imageUtils.ts');
  // }

  try {
    const formData = new FormData();
    
    // @ts-ignore: React Native FormData requires these specific fields
    formData.append('file', {
      uri: uri,
      type: 'image/jpeg', // Adjust if needed or detect from uri
      name: `upload_${Date.now()}.jpg`,
    });
    
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', folder);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return data.secure_url;
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
}

async function uploadToSupabase(uri: string, bucketName: string, folderPath: string = '') {
  try {
    // Use fetch/blob instead of FileSystem.readAsStringAsync for better memory management
    const response = await fetch(uri);
    const blob = await response.blob();
    
    const fileName = `${folderPath ? folderPath + '/' : ''}${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
      });

    if (error) {
      console.error('Upload error details:', {
        message: error.message,
        statusCode: (error as any).statusCode,
        error: error
      });
      throw new Error(`Upload failed: ${error.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (error: any) {
    console.error('Error uploading image:', error);
    throw error;
  }
}
