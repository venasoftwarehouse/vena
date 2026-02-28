import { Favicon, AppleTouchIcon, Icon16, Icon32 } from "@/components/favicon";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import Link from "next/link";

export default function IconsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Ikon Vena</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Halaman ini menampilkan ikon-ikon yang digunakan untuk aplikasi Vena.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="flex flex-col items-center p-6 border border-border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Favicon (32x32)</h2>
            <div className="mb-4 p-4 bg-muted rounded-lg">
              <Favicon />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Digunakan sebagai favicon di browser
            </p>
            <Link href="/favicon.ico" download>
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Download ICO
              </Button>
            </Link>
          </div>

          <div className="flex flex-col items-center p-6 border border-border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Apple Touch Icon (180x180)</h2>
            <div className="mb-4 p-4 bg-muted rounded-lg">
              <AppleTouchIcon />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Digunakan untuk ikon di perangkat Apple
            </p>
            <Link href="/apple-touch-icon.png" download>
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Download PNG
              </Button>
            </Link>
          </div>

          <div className="flex flex-col items-center p-6 border border-border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Icon 16x16</h2>
            <div className="mb-4 p-4 bg-muted rounded-lg">
              <Icon16 />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Digunakan untuk ikon kecil di browser
            </p>
            <Link href="/favicon-16x16.png" download>
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Download PNG
              </Button>
            </Link>
          </div>

          <div className="flex flex-col items-center p-6 border border-border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Icon 32x32</h2>
            <div className="mb-4 p-4 bg-muted rounded-lg">
              <Icon32 />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Digunakan untuk ikon sedang di browser
            </p>
            <Link href="/favicon-32x32.png" download>
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Download PNG
              </Button>
            </Link>
          </div>
        </div>

        <div className="text-center">
          <p className="text-muted-foreground">
            Ikon-ikon ini dibuat menggunakan komponen SVG dari Lucide React.
          </p>
        </div>
      </div>
    </div>
  );
}