import { Quote } from 'lucide-react';

const logos = [
  'Saint Blanc',
  'Celest Diary',
  'Bold Beauty',
  'Viva Agency',
];

const testimonials = [
  {
    quote: 'We finally stopped losing track of creator posts. UGC System shows us what\'s live, what\'s performing, and what\'s next.',
    author: 'Camille J.',
    company: 'Brand Manager at AURA Studios',
  },
];

export function SocialProof() {
  return (
    <section className="py-20 px-6 dark:bg-[#1A1C1F] light:bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="mb-4 text-balance">Trusted by fashion and beauty brands</h2>
          <p className="text-lg text-balance max-w-2xl mx-auto dark:text-text-secondary light:text-text-light-secondary">
            From independent brands to growing agencies — teams use UGC System to stay organized and aligned
          </p>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-8 mb-12">
          {logos.map((logo, index) => (
            <div
              key={index}
              className="px-6 py-3 font-medium text-sm cursor-default linear-transition dark:text-gray-500 dark:hover:text-[#CD7F32] light:text-gray-400 light:hover:text-[#CD7F32]"
            >
              {logo}
            </div>
          ))}
        </div>

        <div className="max-w-3xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="p-6 rounded-md border dark:bg-linear-bg-secondary dark:border-linear-border-subtle light:bg-white light:border-gray-200 light:shadow-md"
            >
              <Quote className="w-5 h-5 mb-4 dark:text-text-tertiary light:text-text-light-tertiary" strokeWidth={1.5} />
              <p className="text-base mb-4 text-balance dark:text-text-primary light:text-text-light-primary">{testimonial.quote}</p>
              <div className="text-xs">
                <div className="font-medium dark:text-text-primary light:text-text-light-primary">{testimonial.author}</div>
                <div className="dark:text-text-tertiary light:text-text-light-tertiary">{testimonial.company}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
