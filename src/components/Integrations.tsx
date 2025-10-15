export function Integrations() {
  const platforms = [
    { name: 'TikTok' },
    { name: 'Meta' },
    { name: 'YouTube' },
    { name: 'Snapchat' },
    { name: 'Pinterest' },
  ];

  return (
    <section id="integrations" className="py-20 px-6 dark:bg-linear-bg light:bg-linear-light-bg">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="mb-4 text-balance">Works with your platforms</h2>
          <p className="text-lg text-balance max-w-2xl mx-auto dark:text-text-secondary light:text-text-light-secondary">
            Seamlessly integrate with all major social networks
          </p>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-6 max-w-4xl mx-auto">
          {platforms.map((platform, index) => (
            <div
              key={index}
              className="group px-5 py-3 backdrop-blur-sm rounded-md border linear-transition hover:scale-105 cursor-pointer dark:bg-linear-bg-secondary dark:border-linear-border-subtle dark:hover:border-linear-border-hover light:bg-white light:border-linear-light-border light:hover:border-linear-light-border-hover"
            >
              <div className="text-base font-medium dark:text-text-primary light:text-text-light-primary">
                {platform.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
