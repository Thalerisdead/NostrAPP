import { useSeoMeta } from '@unhead/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoginArea } from '@/components/auth/LoginArea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { 
  Calendar, 
  BarChart3, 
  Zap, 
  TrendingUp, 
  MessageCircle, 
  Users, 
  Sparkles,
  Timer,
  Target,
  Shield
} from 'lucide-react';

const Index = () => {
  const { user } = useCurrentUser();

  useSeoMeta({
    title: 'Nostr Social - Schedule. Analyze. Grow.',
    description: 'The most powerful way to schedule Nostr posts and track your social performance. Built for creators who demand more.',
  });



  // If user is logged in, show dashboard placeholder
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Welcome to Nostr Social
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              Your dashboard is being prepared. Get ready to revolutionize your Nostr presence.
            </p>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="text-xs">Public Key: {user.pubkey.slice(0, 16)}...</div>
              <LoginArea className="max-w-48" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 overflow-hidden">
      {/* Navigation */}
      <nav className="relative z-50 border-b border-gray-100 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-900 dark:text-white">Nostr Social</span>
            </div>
            <LoginArea className="max-w-48" />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 text-sm">
              <a href="https://soapbox.pub/tools/mkstack/" target="_blank" rel="noopener noreferrer" className="no-underline">
                Vibed with MKStack
              </a>
            </Badge>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 dark:from-white dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent leading-tight">
              Schedule. Analyze. Grow.
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              The most powerful way to schedule Nostr posts and track your social performance. 
              Built for creators who demand more.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <LoginArea className="min-w-64" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Get started in seconds
              </p>
            </div>

            {/* Hero Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">10x</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Faster scheduling</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">24/7</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Analytics tracking</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">∞</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Growth potential</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">0</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Censorship risk</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-800/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
              Designed for Nostr creators
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Everything you need to build, schedule, and scale your presence on the decentralized web.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Smart Scheduling */}
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader className="text-center pb-4">
                <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-xl">Smart Scheduling</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 text-center">
                  Queue your posts across multiple relays with intelligent timing optimization for maximum reach.
                </p>
              </CardContent>
            </Card>

            {/* Real-time Analytics */}
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader className="text-center pb-4">
                <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-xl">Real-time Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 text-center">
                  Track followers, engagement, and zaps with beautiful dashboards that update in real-time.
                </p>
              </CardContent>
            </Card>

            {/* Zap Tracking */}
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader className="text-center pb-4">
                <div className="w-14 h-14 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-xl">Zap Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 text-center">
                  Monitor your Bitcoin earnings with detailed zap analytics and revenue tracking in sats.
                </p>
              </CardContent>
            </Card>

            {/* Growth Insights */}
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader className="text-center pb-4">
                <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-xl">Growth Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 text-center">
                  Discover the best times to post and which content drives the most engagement and growth.
                </p>
              </CardContent>
            </Card>

            {/* Engagement Tracking */}
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader className="text-center pb-4">
                <div className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-xl">Engagement Hub</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 text-center">
                  Monitor likes, comments, and reposts across all your content from one central dashboard.
                </p>
              </CardContent>
            </Card>

            {/* Audience Analytics */}
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader className="text-center pb-4">
                <div className="w-14 h-14 bg-gradient-to-r from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-xl">Audience Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 text-center">
                  Understand your followers and their behavior patterns to create more engaging content.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-16 text-gray-900 dark:text-white">
              Built different. Built better.
            </h2>
            
            <div className="grid md:grid-cols-3 gap-12">
              <div className="text-center">
                <Shield className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Decentralized by Design</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  No single point of failure. Your data stays yours, always.
                </p>
              </div>
              
              <div className="text-center">
                <Timer className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Lightning Fast</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Schedule posts instantly across multiple relays with zero delays.
                </p>
              </div>
              
              <div className="text-center">
                <Target className="w-12 h-12 mx-auto mb-4 text-green-600" />
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Purpose Built</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Designed specifically for Nostr creators who demand excellence.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to revolutionize your Nostr presence?
            </h2>
            <p className="text-xl text-blue-100 mb-12">
              Join the creators who are already scaling their influence on the decentralized web.
            </p>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto">
              <h3 className="text-2xl font-semibold text-white mb-6">Get Started Now</h3>
              <LoginArea className="w-full" />
              <p className="text-sm text-blue-100 mt-4">
                Connect with your Nostr account to begin
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-md flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">Nostr Social</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              The future of social media scheduling and analytics.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Built on open protocols. Designed for freedom.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
