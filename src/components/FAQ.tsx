import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

const faqs = [
  {
    question: 'Do I need a credit card for the trial?',
    answer: 'No. Start free — upgrade when you\'re ready.',
  },
  {
    question: 'Can I switch plans anytime?',
    answer: 'Yes. Upgrade/downgrade in one click.',
  },
  {
    question: 'Is my data safe and GDPR-compliant?',
    answer: 'Yes. Encrypted storage, EU data options, DPA available.',
  },
  {
    question: 'Can agencies manage multiple clients?',
    answer: 'That\'s what Elite is for — multi-brand workspaces and seats.',
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-12 md:py-20 px-4 md:px-6 dark:bg-linear-bg light:bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-3 md:mb-4 tracking-tight">Questions we get a lot</h2>
          <p className="text-base md:text-lg max-w-2xl mx-auto dark:text-text-secondary light:text-text-light-secondary leading-relaxed">
            Quick answers to help you understand how NUUM works
          </p>
        </div>

        <div className="space-y-2.5 md:space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border rounded-md overflow-hidden dark:bg-linear-bg-secondary dark:border-linear-border-subtle light:bg-white light:border-gray-200 light:shadow-sm"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full p-3.5 md:p-4 flex items-center justify-between text-left linear-transition touch-manipulation active:scale-98 dark:hover:bg-white/5 light:hover:bg-black/5"
              >
                <span className="font-semibold pr-3 md:pr-4 text-sm md:text-base dark:text-text-primary light:text-text-light-primary">{faq.question}</span>
                <ChevronDown
                  className={`w-4 h-4 flex-shrink-0 linear-transition dark:text-text-tertiary light:text-text-light-tertiary ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                  strokeWidth={2}
                />
              </button>
              <div
                className={`overflow-hidden linear-transition ${
                  openIndex === index ? 'max-h-48' : 'max-h-0'
                }`}
              >
                <div className="px-3.5 md:px-4 pb-3.5 md:pb-4 text-sm dark:text-text-secondary light:text-text-light-secondary leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
