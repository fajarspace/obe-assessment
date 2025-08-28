import { Result, Button } from "antd";
import { useNavigate } from "react-router-dom";

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <Result
        status="404"
        title="404"
        subTitle="Maaf, halaman yang Anda cari tidak ditemukan."
        extra={
          <Button
            // type="primary"
            className="rounded-lg px-6 py-2 text-base font-medium"
            onClick={() => navigate("/")}
          >
            Kembali ke Beranda
          </Button>
        }
        className=""
      />
    </div>
  );
};

export default NotFound;
