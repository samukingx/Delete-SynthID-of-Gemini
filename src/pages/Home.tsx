import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  Lock, 
  ArrowRight, 
  Check,
  FileX
} from 'lucide-react'

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="container py-24 md:py-32">
        <div className="mx-auto max-w-[800px] text-center">
          <Badge variant="secondary" className="mb-4">
            <span className="mr-1 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            100% local & private
          </Badge>
          
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl mb-6">
            Remove{' '}
            <span className="text-primary">AI</span> traces from your images
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-[600px] mx-auto">
            Process your AI-generated images to remove invisible watermarks, 
            metadata and detection patterns. Your image looks the same, but the traces disappear.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link to="/process">
                Process image for free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="flex items-center justify-center gap-8 mt-12 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-500" />
              <span>No signup</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-500" />
              <span>Instant processing</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-500" />
              <span>100% private</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-24 border-t">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Everything you need
          </h2>
          <p className="text-muted-foreground text-lg max-w-[600px] mx-auto">
            Professional tools to remove any AI trace from your images
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-card/50">
            <CardContent className="pt-6">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <FileX className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Remove metadata</h3>
              <p className="text-muted-foreground text-sm">
                Automatically removes EXIF, origin info, geolocation and all hidden data.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardContent className="pt-6">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Modify LSB bits</h3>
              <p className="text-muted-foreground text-sm">
                Alters the least significant bits to remove invisible AI watermarks.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardContent className="pt-6">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Total privacy</h3>
              <p className="text-muted-foreground text-sm">
                Everything is processed in your browser. Your images never leave your device.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How it works */}
      <section className="container py-24 border-t">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            How it works
          </h2>
          <p className="text-muted-foreground text-lg max-w-[600px] mx-auto">
            Simple 3-step process to remove AI traces
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-lg font-semibold">
              1
            </div>
            <h3 className="font-semibold text-lg mb-2">Upload your image</h3>
            <p className="text-muted-foreground text-sm">
              Drag and drop your image or select it from your device.
            </p>
          </div>

          <div className="text-center">
            <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-lg font-semibold">
              2
            </div>
            <h3 className="font-semibold text-lg mb-2">We process</h3>
            <p className="text-muted-foreground text-sm">
              We remove metadata and alter AI detection patterns.
            </p>
          </div>

          <div className="text-center">
            <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-lg font-semibold">
              3
            </div>
            <h3 className="font-semibold text-lg mb-2">Download</h3>
            <p className="text-muted-foreground text-sm">
              Get your clean image ready to use without AI traces.
            </p>
          </div>
        </div>

        <div className="text-center mt-12">
          <Button size="lg" asChild>
            <Link to="/process">
              Try now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-24">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Ready to protect your images?
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-[500px] mx-auto">
              Start removing AI traces today. No signup, no limits.
            </p>
            <Button size="lg" asChild>
              <Link to="/process">
                Start for free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
