import Link from 'next/link';
import {
  Check,
  X,
  Star,
  CreditCard,
  HelpCircle,
  ChevronDown,
  ArrowRight,
  Shield,
  Zap,
  Globe,
  Clock,
  HeadphonesIcon,
  Database,
  Lock,
  RefreshCw,
  Users,
  BookOpen,
} from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: '199',
    period: '/student/month',
    billing: 'Billed annually. Monthly billing at ₹249/student/month.',
    description:
      'Perfect for small schools getting started with digital management. Get the essentials to digitize your school operations.',
    features: [
      { text: 'Up to 500 students', included: true },
      { text: 'Student & attendance management', included: true },
      { text: 'Fee management & online payments', included: true },
      { text: 'Basic timetable builder', included: true },
      { text: 'Parent portal & mobile access', included: true },
      { text: 'Exam schedule & report cards', included: true },
      { text: 'Document management', included: true },
      { text: 'School calendar & events', included: true },
      { text: 'Announcements & notifications', included: true },
      { text: 'CSV import/export', included: true },
      { text: 'Email support (business hours)', included: true },
      { text: 'Smart timetable auto-generation', included: false },
      { text: 'Teaching tracker', included: false },
      { text: 'LMS & e-learning', included: false },
      { text: 'Analytics dashboard', included: false },
    ],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Professional',
    price: '349',
    period: '/student/month',
    billing: 'Billed annually. Monthly billing at ₹449/student/month.',
    description:
      'For growing schools needing advanced automation, learning management, and deep analytics.',
    features: [
      { text: 'Up to 2,000 students', included: true },
      { text: 'Everything in Starter', included: true },
      { text: 'Smart timetable auto-generation', included: true },
      { text: 'Teaching tracker with tap-to-cover', included: true },
      { text: 'LMS & e-learning platform', included: true },
      { text: 'Live virtual classes', included: true },
      { text: 'Question bank & assessment rubrics', included: true },
      { text: 'Analytics & performance dashboard', included: true },
      { text: 'Transport management', included: true },
      { text: 'Fee automation & concessions', included: true },
      { text: 'Library management', included: true },
      { text: 'Gamification (points/badges)', included: true },
      { text: 'Grievance management', included: true },
      { text: 'Bulk operations & imports', included: true },
      { text: 'Priority email & chat support', included: true },
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '499',
    period: '/student/month',
    billing: 'Billed annually. Custom pricing for 5,000+ students.',
    description:
      'For large institutions and multi-branch networks needing unlimited scale and dedicated support.',
    features: [
      { text: 'Unlimited students', included: true },
      { text: 'Everything in Professional', included: true },
      { text: 'Advanced analytics & AI insights', included: true },
      { text: 'Custom dashboards & reports', included: true },
      { text: 'Hostel management', included: true },
      { text: 'Multi-branch support', included: true },
      { text: 'Staff payroll management', included: true },
      { text: 'API access & integrations', included: true },
      { text: 'White-label options', included: true },
      { text: 'Alumni network module', included: true },
      { text: 'Certificate generation', included: true },
      { text: 'Visitor management', included: true },
      { text: 'Dedicated account manager', included: true },
      { text: '24/7 phone & email support', included: true },
      { text: 'Custom training sessions', included: true },
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

const comparisonFeatures = [
  { category: 'Core', features: [
    { name: 'Student Management', starter: true, pro: true, enterprise: true },
    { name: 'Attendance (Daily & Period)', starter: true, pro: true, enterprise: true },
    { name: 'Fee Management', starter: true, pro: true, enterprise: true },
    { name: 'Report Cards', starter: true, pro: true, enterprise: true },
    { name: 'Parent Portal', starter: true, pro: true, enterprise: true },
    { name: 'School Calendar', starter: true, pro: true, enterprise: true },
  ]},
  { category: 'Advanced Academics', features: [
    { name: 'Smart Timetable (Auto-gen)', starter: false, pro: true, enterprise: true },
    { name: 'Teaching Tracker', starter: false, pro: true, enterprise: true },
    { name: 'LMS & Content Library', starter: false, pro: true, enterprise: true },
    { name: 'Live Virtual Classes', starter: false, pro: true, enterprise: true },
    { name: 'Question Bank', starter: false, pro: true, enterprise: true },
    { name: 'Gamification', starter: false, pro: true, enterprise: true },
    { name: 'Personalized Learning Paths', starter: false, pro: true, enterprise: true },
  ]},
  { category: 'Communication', features: [
    { name: 'Announcements', starter: true, pro: true, enterprise: true },
    { name: 'Push/Email Notifications', starter: true, pro: true, enterprise: true },
    { name: 'SMS & WhatsApp Notifications', starter: false, pro: true, enterprise: true },
    { name: 'Parent-Teacher Messaging', starter: false, pro: true, enterprise: true },
    { name: 'PTM Booking', starter: false, pro: true, enterprise: true },
    { name: 'Grievance Management', starter: false, pro: true, enterprise: true },
  ]},
  { category: 'Finance', features: [
    { name: 'Fee Collection (Cash/Online)', starter: true, pro: true, enterprise: true },
    { name: 'Fee Automation & Reminders', starter: false, pro: true, enterprise: true },
    { name: 'Scholarships & Concessions', starter: false, pro: true, enterprise: true },
    { name: 'Staff Payroll', starter: false, pro: false, enterprise: true },
    { name: 'Expense Tracking', starter: false, pro: false, enterprise: true },
  ]},
  { category: 'Operations', features: [
    { name: 'Transport Management', starter: false, pro: true, enterprise: true },
    { name: 'Library Management', starter: false, pro: true, enterprise: true },
    { name: 'Hostel Management', starter: false, pro: false, enterprise: true },
    { name: 'Visitor Management', starter: false, pro: false, enterprise: true },
    { name: 'ID Card Generation', starter: false, pro: true, enterprise: true },
    { name: 'Certificate Generation', starter: false, pro: false, enterprise: true },
  ]},
  { category: 'Platform', features: [
    { name: 'Multi-branch Support', starter: false, pro: false, enterprise: true },
    { name: 'API Access', starter: false, pro: false, enterprise: true },
    { name: 'White-label Branding', starter: false, pro: false, enterprise: true },
    { name: 'Custom Dashboards', starter: false, pro: false, enterprise: true },
    { name: 'Advanced Analytics & AI', starter: false, pro: false, enterprise: true },
    { name: 'Alumni Network', starter: false, pro: false, enterprise: true },
  ]},
];

const allPlansInclude = [
  { icon: Lock, title: 'SSL Encryption', desc: 'Data encrypted at rest and in transit' },
  { icon: Database, title: 'Daily Backups', desc: 'Automated daily backups with point-in-time recovery' },
  { icon: Shield, title: 'DPDP Compliance', desc: 'Compliant with India\'s Digital Personal Data Protection Act 2023' },
  { icon: Clock, title: '99.9% Uptime SLA', desc: 'Enterprise-grade infrastructure with guaranteed uptime' },
  { icon: Globe, title: 'AWS India Servers', desc: 'Data hosted on AWS Mumbai region for low latency' },
  { icon: RefreshCw, title: 'Free Updates', desc: 'All new features and updates included at no extra cost' },
  { icon: Users, title: 'Unlimited Staff Accounts', desc: 'No per-teacher or per-admin charges' },
  { icon: BookOpen, title: 'Free Onboarding', desc: 'Guided setup, data migration, and initial training' },
];

const faqs = [
  {
    question: 'Can I try GlobusLMS before committing to a plan?',
    answer:
      'Absolutely! All plans come with a 30-day free trial with no credit card required. You get full Professional plan access during the trial so you can explore everything GlobusLMS has to offer.',
  },
  {
    question: 'How is the pricing calculated?',
    answer:
      'Pricing is per active student per month. You only pay for currently enrolled students. If a student leaves mid-term, they are removed from billing in the next cycle. Staff accounts are unlimited and free.',
  },
  {
    question: 'Can I switch between plans?',
    answer:
      'Yes, upgrade anytime for immediate access to new features. Downgrades take effect at the next billing cycle. Our team helps with smooth transitions.',
  },
  {
    question: 'Is there a setup fee?',
    answer:
      'No setup fees for any plan. Enterprise customers get free onboarding, data migration from existing systems, and custom training sessions.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'All major credit/debit cards, UPI, net banking, and bank transfers. Enterprise plans support invoicing with NET 30 payment terms.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We use AWS cloud infrastructure with servers in Mumbai, India. Compliant with DPDP Act 2023 with SOC 2 certification in progress.',
  },
  {
    question: 'Do you offer discounts?',
    answer:
      'Annual billing saves ~20% vs monthly. We offer special discounts for government schools, charitable institutions, and schools with 3,000+ students. Contact sales for custom pricing.',
  },
  {
    question: 'Can I import data from my existing software?',
    answer:
      'Yes! Import from Excel, CSV, Tally, and most popular school management systems. Our team assists with data migration during onboarding to ensure zero data loss.',
  },
  {
    question: 'What boards do you support?',
    answer:
      'GlobusLMS supports CBSE, ICSE, all State Boards, IB, and Cambridge (IGCSE). The grading system, report card templates, and curriculum modules are fully configurable for any board.',
  },
  {
    question: 'Can I use GlobusLMS for multiple branches?',
    answer:
      'Yes! The Enterprise plan includes multi-branch support with a consolidated super-admin dashboard, centralized user management, and branch-level reporting and analytics.',
  },
];

export default function PricingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 py-20 sm:py-28">
        <div className="absolute top-10 left-1/4 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm mb-6">
            <CreditCard className="h-4 w-4" />
            Transparent Pricing
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-6 text-lg text-blue-100 max-w-2xl mx-auto">
            Pay per student. No hidden fees. No per-teacher charges. Start
            with a 30-day free trial, scale as your school grows.
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" className="w-full" preserveAspectRatio="none">
            <path
              d="M0 80L60 74.7C120 69.3 240 58.7 360 53.3C480 48 600 48 720 53.3C840 58.7 960 69.3 1080 69.3C1200 69.3 1320 58.7 1380 53.3L1440 48V80H0Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl flex flex-col ${
                  plan.popular
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-2xl shadow-blue-500/25 lg:scale-105 border-0 p-10'
                    : 'bg-white border border-gray-200 shadow-sm p-8 hover:shadow-lg transition-shadow'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-4 py-1 rounded-full bg-yellow-400 text-yellow-900 text-xs font-bold uppercase tracking-wider shadow-lg">
                      <Star className="h-3 w-3" />
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3
                    className={`text-2xl font-bold ${
                      plan.popular ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className={`mt-2 text-sm leading-relaxed ${
                      plan.popular ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {plan.description}
                  </p>
                </div>

                <div className="mb-2">
                  <span
                    className={`text-5xl font-extrabold ${
                      plan.popular ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    &#8377;{plan.price}
                  </span>
                  <span
                    className={`text-base ${
                      plan.popular ? 'text-blue-200' : 'text-gray-500'
                    }`}
                  >
                    {plan.period}
                  </span>
                </div>
                <p
                  className={`text-xs mb-8 ${
                    plan.popular ? 'text-blue-200' : 'text-gray-400'
                  }`}
                >
                  {plan.billing}
                </p>

                <ul className="space-y-3 mb-10 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature.text} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check
                          className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                            plan.popular ? 'text-blue-200' : 'text-blue-600'
                          }`}
                        />
                      ) : (
                        <span className="h-5 w-5 flex-shrink-0 mt-0.5 flex items-center justify-center text-gray-300">
                          &mdash;
                        </span>
                      )}
                      <span
                        className={`text-sm ${
                          feature.included
                            ? plan.popular
                              ? 'text-blue-50'
                              : 'text-gray-700'
                            : 'text-gray-400'
                        }`}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/login"
                  className={`block text-center py-3.5 px-6 rounded-xl font-semibold text-base transition-all ${
                    plan.popular
                      ? 'bg-white text-blue-700 hover:bg-blue-50 shadow-lg'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/25'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* All Plans Include */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-4">
              <Shield className="h-4 w-4" />
              Included in Every Plan
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              Everything You Need, Out of the Box
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Security, compliance, and infrastructure -- included at no extra cost on every plan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {allPlansInclude.map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
                  <item.icon className="h-5 w-5 text-blue-600" />
                </div>
                <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-4">
              <Zap className="h-4 w-4" />
              Detailed Comparison
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              Compare Plans Side by Side
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 pr-4 text-sm font-semibold text-gray-900 w-[40%]">
                    Feature
                  </th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-gray-900">
                    Starter
                    <div className="text-xs font-normal text-gray-400 mt-0.5">&#8377;199/mo</div>
                  </th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-blue-600">
                    Professional
                    <div className="text-xs font-normal text-blue-400 mt-0.5">&#8377;349/mo</div>
                  </th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-gray-900">
                    Enterprise
                    <div className="text-xs font-normal text-gray-400 mt-0.5">&#8377;499/mo</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((group) => (
                  <>
                    <tr key={group.category}>
                      <td
                        colSpan={4}
                        className="pt-6 pb-2 text-xs font-bold text-gray-400 uppercase tracking-wider"
                      >
                        {group.category}
                      </td>
                    </tr>
                    {group.features.map((feature) => (
                      <tr
                        key={feature.name}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 pr-4 text-sm text-gray-700">
                          {feature.name}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {feature.starter ? (
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-gray-300 mx-auto" />
                          )}
                        </td>
                        <td className="py-3 px-4 text-center bg-blue-50/50">
                          {feature.pro ? (
                            <Check className="h-5 w-5 text-blue-600 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-gray-300 mx-auto" />
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {feature.enterprise ? (
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-gray-300 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-500/25"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="text-sm text-gray-500">
              30-day free trial with Professional plan access
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-4">
              <HelpCircle className="h-4 w-4" />
              FAQ
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Everything you need to know about GlobusLMS pricing and plans.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer px-6 py-5 text-left">
                  <span className="font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </span>
                  <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0 group-open:rotate-180 transition-transform duration-200" />
                </summary>
                <div className="px-6 pb-5 -mt-1">
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        <div className="absolute top-10 right-10 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Still Have Questions?
          </h2>
          <p className="mt-4 text-lg text-blue-100 max-w-2xl mx-auto">
            Our team is happy to help you find the right plan. Book a free demo
            and see GlobusLMS in action with your school&apos;s data.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-blue-700 font-semibold hover:bg-blue-50 transition-all shadow-lg"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/#contact"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white/10 backdrop-blur-sm text-white font-semibold border border-white/20 hover:bg-white/20 transition-all"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
