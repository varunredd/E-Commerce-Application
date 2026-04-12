import { FileIcon, UploadCloudIcon, XIcon } from "lucide-react";
import api from '@/lib/api';
import PropTypes from 'prop-types';
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";

function ProductImageUpload({
    imageFile,
    setImageFile,
    imageLoadingState,
    uploadedImageUrl,
    setUploadedImageUrl,
    setImageLoadingState,
    isEditMode,

}) {
  const inputRef = useRef(null);


  function handleImageFileChange(event) {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) setImageFile(selectedFile);
  }

  function handleDragOver(event) {
    event.preventDefault();
  }

  function handleDrop(event) {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) setImageFile(droppedFile);
  }

  function handleRemoveImage() {
    setImageFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }
  
  async function uploadImageToCloudinary() {
    setImageLoadingState(true);
    const data = new FormData();
    data.append("my_file", imageFile);
    const response = await api.post(
      "/api/admin/products/upload-image",
      data
    );

    if (response?.data?.success) {
      setUploadedImageUrl(response.data.result.url);
      setImageLoadingState(false);
    }
  }
  useEffect(() => {
    if (imageFile !== null) uploadImageToCloudinary();
  }, [imageFile]);

 
  return (
    <div
      className={`w-full  mt-4  max-w-md mx-auto`}
    >
      <Label className="text-lg font-semibold mb-2 block">Upload Image</Label>
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`${
          isEditMode ? "opacity-60" : ""
        } border-2 border-dashed rounded-lg p-4`}
      >
        <Input
          id="image-upload"
          type="file"
          className="hidden"
          ref={inputRef}
          onChange={handleImageFileChange}
          disabled={isEditMode}
        />
        {!imageFile ? (
          <Label
            htmlFor="image-upload"
            className={`${
              isEditMode ? "cursor-not-allowed" : ""
            } flex flex-col items-center justify-center h-32 cursor-pointer`}
          >
            <UploadCloudIcon className="w-10 h-10 text-muted-foreground mb-2" />
            <span>Drag & drop or click to upload image</span>
          </Label>
        ) : imageLoadingState ? (
            <Skeleton className="h-10 bg-gray-100" />
          ): (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileIcon className="w-8 text-primary mr-2 h-8" />
            </div>
            <p className="text-sm font-medium">{imageFile.name}</p>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              onClick={handleRemoveImage}
            >
              <XIcon className="w-4 h-4" />
              <span className="sr-only">Remove File</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
ProductImageUpload.propTypes = {
  imageFile: PropTypes.object,
  setImageFile: PropTypes.func,
  uploadedImageUrl: PropTypes.string,
  setUploadedImageUrl: PropTypes.func,
  setImageLoadingState: PropTypes.func,
  imageLoadingState: PropTypes.bool,
  isEditMode: PropTypes.bool,
};

export default ProductImageUpload;
