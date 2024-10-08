"use client";
import { useEffect, useRef, useState } from "react";
import SelectOne from "../component/Select";
import data from "../../data/dataStyleTransfer.json";
import { postGenerateImage, postUploadImage } from "@/services/apiServices";
import { message } from "antd";
import CircleLoader from "react-spinners/CircleLoader";
import { FcImageFile } from "react-icons/fc";
import { FiPlus } from "react-icons/fi";

const PageStyleSnap = () => {
  const [background, setBackground] = useState();
  const videoRef = useRef(null);
  const [preViewImage, setPreViewImage] = useState();
  const [imageCloud, setImageCloud] = useState();
  const canvasRef = useRef(null);
  const [imageGenerate, setImageGenerate] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCapture, setIsLoadingCapture] = useState(false);
  const [style, setStyle] = useState();

  const capturePhoto = async () => {
    setIsLoadingCapture(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!video || !canvas) {
      message.error("Không thể truy cập video hoặc canvas.");
      return;
    }
    // Thiết lập chiều rộng và chiều cao cho canvas
    canvas.width = videoRef.current.videoHeight; // Hoán đổi chiều rộng và chiều cao
    canvas.height = videoRef.current.videoWidth;

    const context = canvas.getContext("2d");

    // Dịch chuyển gốc tọa độ đến giữa canvas mới
    context.translate(canvas.width / 2, canvas.height / 2);

    // Xoay canvas -90 độ (ngược chiều kim đồng hồ)
    context.rotate(Math.PI / 2);

    // Vẽ video lên canvas, lưu ý điều chỉnh lại tọa độ sau khi xoay
    context.drawImage(
      videoRef.current,
      -canvas.height / 2,
      -canvas.width / 2,
      canvas.height,
      canvas.width
    );

    const imageDataUrl = canvas.toDataURL("image/png", 1.0);
    setPreViewImage(imageDataUrl);
    const blob = await (await fetch(imageDataUrl)).blob();
    const selectedFile = new File([blob], "captured-image.png", {
      type: "image/png",
    });

    try {
      const res = await postUploadImage(selectedFile);
      console.log("check image", res);

      if (res.status === 200 || res.success === true) {
        // Tùy thuộc vào phản hồi API của bạn
        setImageCloud(res.data.filename);
      } else {
        throw new Error("Upload failed");
      }
    } catch (e) {
      console.error("Upload image error:", e);
      message.error("Upload image thất bại!");
    } finally {
      setIsLoadingCapture(false);
      message.success("Upload image thành công!");
    }
  };

  const takePictureAgain = () => {
    setPreViewImage(""); // Xóa ảnh chụp

    // Ngừng hiển thị video tạm thời (nếu cần)
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Khởi động lại camera
    navigator.mediaDevices
      .getUserMedia({
        video: { width: 1920, height: 1920 }, // Độ phân giải gốc của camera
      })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch((err) => {
        console.error("Lỗi khi truy cập camera:", err);
        message.error("Không thể truy cập camera của bạn.");
      });
  };

  const handleGenerateImage = async () => {
    setIsLoading(true);
    try {
      console.log(imageCloud, background, style);

      const res = await postGenerateImage(imageCloud, background, style);
      console.log(res);
      if (res.data.status === 200) {
        setImageGenerate(res.data.message[0].url);
      }
    } catch (e) {
      setIsLoading(false);
      console.log(e);
      message.error("Don't generate image now!");
    } finally {
      setIsLoading(false);
    }
  };

  const checkDisableButton = () => {
    if (!isLoading && !isLoadingCapture) {
      if (background && style) {
        return false;
      } else {
        return true;
      }
    } else {
      return true;
    }
  };

  const handleUploadImage = async (event) => {
    if (event.target && event.target.files && event.target.files[0]) {
      setPreViewImage(URL.createObjectURL(event.target.files[0]));
      //set name image
      var today = new Date(),
        date =
          today.getSeconds() +
          "-" +
          today.getMinutes() +
          "-" +
          today.getHours() +
          "-" +
          today.getDate() +
          "-" +
          (today.getMonth() + 1) +
          "-" +
          today.getFullYear();

      const selectedFile = event.target.files[0];

      let fileExtension = ".jpg";

      if (selectedFile.type === "image/png") {
        fileExtension = ".png";
      }

      const newFileName = `face-image-${date}${fileExtension}`;
      const newFile = new File([selectedFile], newFileName, {
        type: selectedFile.type,
      });

      //get api upload image
      try {
        const res = await postUploadImage(newFile);
        if (res.status === 200 || res.success === true) {
          console.log(res);

          setImageCloud(res.data.filename);
        } else {
          throw new Error("Upload failed");
        }
      } catch (e) {
        console.log(e);
        message.error("Don't upload file now!");
      }
    } else {
      setPreViewImage("");
    }
  };

  useEffect(() => {
    async function getVideo() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1920, height: 1920 }, // Độ phân giải gốc của camera
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera: ", err);
      }
    }

    getVideo();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="w-full max-h-[94vh] h-[94vh] items-center justify-center p-4 bg-white">
      <div className="w-full items-center flex justify-center text-[40px] font-bold uppercase">
        Style Snap AI
      </div>
      <div className="flex w-full h-full gap-3">
        <div className="w-2/5 flex flex-col items-center gap-4 bg-slate-100 p-4 m-4 rounded-md border border-slate-200 shadow-2xl">
          <p className="text-2xl font-medium">
            {preViewImage ? "Preview Image" : "Live cam"}
          </p>
          {preViewImage ? (
            <div className="flex flex-col items-center gap-4">
              <div className="min-h-[70vh] max-h-[70vh] h-fit items-center flex">
                <img
                  src={preViewImage}
                  alt="Captured"
                  className="rounded-lg shadow-xl w-[100%] h-[100%]"
                />
              </div>
              <button
                disabled={isLoadingCapture}
                className={`rounded-lg px-5 py-2 text-white hover:text-slate-50 bg-slate-800 ${
                  isLoading || isLoadingCapture
                    ? "bg-slate-600 cursor-not-allowed hover:bg-slate-600"
                    : "hover:bg-slate-900"
                }`}
                onClick={takePictureAgain}
              >
                Take picture again
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center w-full gap-4">
              <div className="min-h-[70vh] max-h-[70vh] h-fit items-center flex">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="rounded-lg shadow-xl w-[100%] h-[100%]"
                />
              </div>
              <div className="flex gap-4 items-center">
                {" "}
                <button
                  className="rounded-lg px-6 py-3 bg-slate-800 text-white hover:text-slate-50 hover:bg-slate-900"
                  onClick={capturePhoto}
                >
                  Snap Photo
                </button>
                <div className="flex justify-center items-center rounded-lg cursor-pointer font-medium bg-sky-400 px-6 py-3 text-slate-100">
                  <label
                    htmlFor="labelUpload"
                    className="w-full flex items-center justify-center rounded-md cursor-pointer"
                  >
                    <FiPlus /> Upload
                  </label>
                  <input
                    type="file"
                    id="labelUpload"
                    className="hidden"
                    onChange={(event) => handleUploadImage(event)}
                  />
                </div>
              </div>
            </div>
          )}
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
        <div className="w-2/5 flex flex-col items-center gap-4 bg-slate-100 p-4 m-4 rounded-md border border-slate-200 shadow-2xl font-medium">
          <p className="text-2xl">Image generate</p>
          <div className="min-h-[70vh] max-h-[70vh] h-fit items-center flex">
            {imageGenerate ? (
              <img
                src={imageGenerate}
                className="rounded-lg shadow-xl w-auto h-[100%]"
                alt="img"
              />
            ) : (
              <FcImageFile size={40} />
            )}
          </div>
        </div>
        <div className="w-1/5 flex flex-col gap-4 pr-5 bg-slate-100 p-4 m-4 rounded-md border border-slate-200 shadow-2xl">
          <p className="text-2xl font-medium">Setting</p>
          <div className="w-full flex flex-col gap-1">
            <p>Background</p>
            <SelectOne
              options={data.backgroundList}
              value={background}
              setValue={setBackground}
            />
          </div>
          <div className="flex flex-col gap-1">
            <p>Style</p>
            <SelectOne
              options={data.styleList}
              value={style}
              setValue={setStyle}
            />
          </div>
          <button
            disabled={checkDisableButton()}
            onClick={handleGenerateImage}
            className={`rounded-lg w-full h-10 flex items-center justify-center text-white font-medium text-lg transition ease-in-out delay-150 
    ${
      checkDisableButton()
        ? "bg-gradient-to-tr from-sky-500 to-green-400 cursor-not-allowed"
        : "bg-gradient-to-tr from-sky-600 to-green-500 hover:bg-gradient-to-br hover:from-green-400 hover:to-cyan-600"
    }`}
          >
            {isLoading ? (
              <CircleLoader size={16} color="white" />
            ) : (
              "Generate image"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
export default PageStyleSnap;
