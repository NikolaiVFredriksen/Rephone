type ImageUploaderProps = {
  images: File[];
  onImagesChange: (images: File[]) => void;
};

export default function ImageUploader({
  images,
  onImagesChange,
}: ImageUploaderProps) {
  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    onImagesChange([...images, ...files].slice(0, 3));
  }

  return (
    <div className="flex justify-center gap-3 mt-2 mb-4">
      {[0, 1, 2].map((i) => (
        <label
          key={i}
          style={{
            width: 72,
            height: 72,
            background: "white",
            border: "1px dashed #C9A98D",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#C9A98D",
            fontSize: 24,
            overflow: "hidden",
          }}
        >
          {images[i] ? (
            <img
              src={URL.createObjectURL(images[i])}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            "+"
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </label>
      ))}
    </div>
  );
}
