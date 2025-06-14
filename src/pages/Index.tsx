import { useSeoMeta } from '@unhead/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoginArea } from '@/components/auth/LoginArea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
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
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  useSeoMeta({
    title: 'Nostr Social - Schedule. Analyze. Grow.',
    description: 'The most powerful way to schedule Nostr posts and track your social performance. Built for creators who demand more.',
  });

  // If user is logged in, show dashboard placeholder
  if (user) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950"
      >
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-2xl mx-auto">
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-16 h-16 bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-4xl font-bold mb-4 bg-gradient-to-r from-orange-900 to-amber-700 dark:from-orange-100 dark:to-amber-200 bg-clip-text text-transparent"
            >
              Welcome to Nostr Social
            </motion.h1>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-xl text-gray-600 dark:text-gray-400 mb-8"
            >
              Your dashboard is being prepared. Get ready to revolutionize your Nostr presence.
            </motion.p>
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
            >
              <Card className="p-4 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
                <CardContent className="p-0">
                  <div className="flex items-center gap-3">
                    <Timer className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    <div>
                      <p className="font-medium text-orange-900 dark:text-orange-100">Schedule Posts</p>
                      <p className="text-sm text-orange-700 dark:text-orange-300">Plan your content in advance</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <a href="/schedule" className="inline-block">
                <Card className="p-4 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <p className="font-medium text-emerald-900 dark:text-emerald-100">Go to Scheduler →</p>
                        <p className="text-sm text-emerald-700 dark:text-emerald-300">Manage your scheduled posts</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </a>
            </motion.div>
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              className="flex items-center justify-center space-x-4 text-sm text-gray-500 dark:text-gray-400"
            >
              <div className="text-xs">Public Key: {user.pubkey.slice(0, 16)}...</div>
              <LoginArea className="max-w-48" />
            </motion.div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 overflow-hidden">
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-50 border-b border-orange-100/50 dark:border-orange-800/50 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-900 dark:text-white">Nostr Social</span>
            </motion.div>
            <LoginArea className="max-w-48" />
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.section 
        ref={heroRef}
        className="relative pt-20 pb-32 overflow-hidden"
      >
        <motion.div 
          style={{ y, opacity }}
          className="absolute inset-0 bg-gradient-to-br from-orange-50/30 to-amber-50/30 dark:from-orange-950/30 dark:to-amber-950/30"
        />
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Badge variant="secondary" className="mb-6 text-sm hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors duration-200">
                <a href="https://soapbox.pub/tools/mkstack/" target="_blank" rel="noopener noreferrer" className="no-underline">
                  Vibed with MKStack
                </a>
              </Badge>
            </motion.div>
            
            <motion.h1 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-orange-900 via-amber-800 to-orange-700 dark:from-orange-100 dark:via-amber-200 dark:to-orange-100 bg-clip-text text-transparent leading-tight"
            >
              Schedule. Analyze. Grow.
            </motion.h1>
            
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              The most powerful way to schedule Nostr posts and track your social performance. 
              Built for creators who demand more.
            </motion.p>

            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
            >
              <LoginArea className="min-w-64" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Get started in seconds
              </p>
            </motion.div>

            {/* Hero Metrics */}
            <motion.div 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto"
            >
              {[
                { value: '10x', label: 'Faster scheduling' },
                { value: '24/7', label: 'Analytics tracking' },
                { value: '∞', label: 'Growth potential' },
                { value: '0', label: 'Censorship risk' }
              ].map((metric, index) => (
                <motion.div 
                  key={metric.label}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 1 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-4 rounded-2xl hover:bg-orange-50/50 dark:hover:bg-orange-900/20 transition-all duration-300"
                >
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{metric.value}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{metric.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section className="py-24 bg-orange-50/50 dark:bg-orange-900/20 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
              Designed for Nostr creators
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Everything you need to build, schedule, and scale your presence on the decentralized web.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Smart Scheduling */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 h-full group">
                <CardHeader className="text-center pb-4">
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-14 h-14 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300"
                  >
                    <Calendar className="w-7 h-7 text-white" />
                  </motion.div>
                  <CardTitle className="text-xl group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-300">Smart Scheduling</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed">
                    Queue your posts across multiple relays with intelligent timing optimization for maximum reach.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Real-time Analytics */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 h-full group">
                <CardHeader className="text-center pb-4">
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    className="w-14 h-14 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300"
                  >
                    <BarChart3 className="w-7 h-7 text-white" />
                  </motion.div>
                  <CardTitle className="text-xl group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-300">Real-time Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed">
                    Track followers, engagement, and zaps with beautiful dashboards that update in real-time.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Zap Tracking */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 h-full group">
                <CardHeader className="text-center pb-4">
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    className="w-14 h-14 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300"
                  >
                    <Zap className="w-7 h-7 text-white" />
                  </motion.div>
                  <CardTitle className="text-xl group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors duration-300">Zap Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed">
                    Monitor your Bitcoin earnings with detailed zap analytics and revenue tracking in sats.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Growth Insights */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 h-full group">
                <CardHeader className="text-center pb-4">
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: -10 }}
                    className="w-14 h-14 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300"
                  >
                    <TrendingUp className="w-7 h-7 text-white" />
                  </motion.div>
                  <CardTitle className="text-xl group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">Growth Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed">
                    Discover the best times to post and which content drives the most engagement and growth.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Engagement Tracking */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              viewport={{ once: true }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 h-full group">
                <CardHeader className="text-center pb-4">
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 8 }}
                    className="w-14 h-14 bg-gradient-to-r from-stone-600 to-slate-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300"
                  >
                    <MessageCircle className="w-7 h-7 text-white" />
                  </motion.div>
                  <CardTitle className="text-xl group-hover:text-stone-600 dark:group-hover:text-stone-400 transition-colors duration-300">Engagement Hub</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed">
                    Monitor likes, comments, and reposts across all your content from one central dashboard.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Audience Analytics */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 h-full group">
                <CardHeader className="text-center pb-4">
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: -8 }}
                    className="w-14 h-14 bg-gradient-to-r from-red-500 to-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300"
                  >
                    <Users className="w-7 h-7 text-white" />
                  </motion.div>
                  <CardTitle className="text-xl group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-300">Audience Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed">
                    Understand your followers and their behavior patterns to create more engaging content.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-50/50 to-amber-50/50 dark:from-orange-900/50 dark:to-amber-900/50" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h2 
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold mb-16 text-gray-900 dark:text-white"
            >
              Built different. Built better.
            </motion.h2>
            
            <div className="grid md:grid-cols-3 gap-12">
              {[
                { icon: Shield, color: 'orange', title: 'Decentralized by Design', description: 'No single point of failure. Your data stays yours, always.' },
                { icon: Timer, color: 'amber', title: 'Lightning Fast', description: 'Schedule posts instantly across multiple relays with zero delays.' },
                { icon: Target, color: 'emerald', title: 'Purpose Built', description: 'Designed specifically for Nostr creators who demand excellence.' }
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div 
                    key={item.title}
                    initial={{ y: 40, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -5 }}
                    className="text-center group cursor-pointer"
                  >
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className={`w-16 h-16 mx-auto mb-6 p-4 rounded-2xl bg-gradient-to-br from-${item.color}-500 to-${item.color}-600 shadow-lg group-hover:shadow-xl transition-shadow duration-300`}
                    >
                      <Icon className="w-full h-full text-white" />
                    </motion.div>
                    <h3 className={`text-xl font-semibold mb-3 text-gray-900 dark:text-white group-hover:text-${item.color}-600 dark:group-hover:text-${item.color}-400 transition-colors duration-300`}>{item.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {item.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-orange-600 via-amber-600 to-red-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <motion.div 
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          transition={{ duration: 20, ease: "linear", repeat: Infinity }}
          className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl"
        />
        <motion.div 
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          transition={{ duration: 25, ease: "linear", repeat: Infinity, delay: 10 }}
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full blur-3xl"
        />
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <motion.h2 
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold text-white mb-6"
            >
              Ready to revolutionize your Nostr presence?
            </motion.h2>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-xl text-orange-100 mb-12"
            >
              Join the creators who are already scaling their influence on the decentralized web.
            </motion.p>
            
            <motion.div 
              initial={{ y: 30, opacity: 0, scale: 0.9 }}
              whileInView={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
              className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 max-w-md mx-auto border border-white/20 shadow-2xl"
            >
              <h3 className="text-2xl font-semibold text-white mb-6">Get Started Now</h3>
              <LoginArea className="w-full" />
              <p className="text-sm text-orange-100 mt-4">
                Connect with your Nostr account to begin
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-orange-50/80 dark:bg-orange-900/80 border-t border-orange-200/50 dark:border-orange-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center justify-center space-x-2 mb-4"
            >
              <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-amber-600 rounded-md flex items-center justify-center shadow-lg">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">Nostr Social</span>
            </motion.div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              The future of social media scheduling and analytics.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Built on open protocols. Designed for freedom.
            </p>
          </motion.div>
        </div>
      </footer>
    </div>
  );
};

export default Index;