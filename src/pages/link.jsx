import DeviceStats from "@/components/device-stats";
import Location from "@/components/location-stats";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {UrlState} from "@/context";
import {getClicksForUrl} from "@/db/apiClicks";
import {deleteUrl, getUrl} from "@/db/apiUrls";
import useFetch from "@/hooks/use-fetch";
import {ArrowLeft, Copy, LinkIcon, QrCode, Trash} from "lucide-react";
import {useEffect} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {BeatLoader} from "react-spinners";
import appBaseUrl from "@/lib/base-url";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const LinkPage = () => {
  const downloadImage = () => {
    const imageUrl = url?.qr;
    const fileName = url?.title;

    const anchor = document.createElement("a");
    anchor.href = imageUrl;
    anchor.download = fileName;

    document.body.appendChild(anchor);

    anchor.click();

    document.body.removeChild(anchor);
  };
  const navigate = useNavigate();
  const {user} = UrlState();
  const {id} = useParams();
  const {
    loading,
    data: url,
    fn,
    error,
  } = useFetch(getUrl, {id, user_id: user?.id});

  const {
    loading: loadingStats,
    data: stats,
    fn: fnStats,
  } = useFetch(getClicksForUrl, id);

  const {loading: loadingDelete, fn: fnDelete} = useFetch(deleteUrl, id);

  useEffect(() => {
    fn();
  }, []);

  useEffect(() => {
    if (!error && loading === false) fnStats();
  }, [loading, error]);

  useEffect(() => {
    if (!id) return;
    const intervalId = setInterval(() => {
      fnStats();
    }, 5000);
    return () => clearInterval(intervalId);
  }, [id, fnStats]);

  if (error) {
    navigate("/dashboard");
  }

  let link = "";
  if (url) {
    link = url?.custom_url ? url?.custom_url : url.short_url;
  }
  const shortLink = link ? `${appBaseUrl}/${link}` : "";

  return (
    <>
      <div className="flex flex-col gap-8 sm:flex-row justify-between">
        <div className="flex flex-col items-start gap-8 rounded-lg sm:w-2/5">
          <button
            onClick={() => {
              window.location.href = "/dashboard";
            }}
            className="inline-flex items-center text-gray-300 hover:text-white"
            aria-label="Back to Links"
            title="Back to Links"
          >
            <ArrowLeft size={18} />
          </button>
          <span className="text-6xl font-extrabold hover:underline cursor-pointer">
            {url?.title}
          </span>
          <a
            href={shortLink}
            target="_blank"
            className="text-3xl sm:text-4xl text-blue-400 font-bold hover:underline cursor-pointer"
          >
            {shortLink}
          </a>
          <a
            href={url?.original_url}
            target="_blank"
            className="flex items-center gap-1 hover:underline cursor-pointer"
          >
            <LinkIcon className="p-1" />
            {url?.original_url}
          </a>
          <span className="flex items-end font-extralight text-sm">
            {new Date(url?.created_at).toLocaleString()}
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => navigator.clipboard.writeText(shortLink)}
            >
              <Copy />
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost">
                  <QrCode />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>QR Code</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4">
                  <img
                    src={url?.qr}
                    className="w-full object-contain"
                    alt="qr code"
                  />
                </div>
              </DialogContent>
            </Dialog>
            <Button
              variant="ghost"
              onClick={() =>
                fnDelete().then(() => {
                  navigate("/dashboard");
                })
              }
              disable={loadingDelete}
            >
              {loadingDelete ? (
                <BeatLoader size={5} color="white" />
              ) : (
                <Trash />
              )}
            </Button>
          </div>
          <img
            src={url?.qr}
            className="w-full self-center sm:self-start ring ring-blue-500 p-1 object-contain"
            alt="qr code"
          />
        </div>

        <Card className="sm:w-3/5">
          <CardHeader>
            <CardTitle className="text-4xl font-extrabold">Stats</CardTitle>
          </CardHeader>
          {stats && stats.length ? (
            <CardContent className="flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Total Clicks</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{stats?.length}</p>
                </CardContent>
              </Card>

              <CardTitle>Location Data</CardTitle>
              <Location stats={stats} />
              <CardTitle>Device Info</CardTitle>
              <DeviceStats stats={stats} />
            </CardContent>
          ) : (
            <CardContent>
              {loadingStats === false
                ? "No Statistics yet"
                : "Loading Statistics.."}
            </CardContent>
          )}
        </Card>
      </div>
    </>
  );
};

export default LinkPage;
