export function Integrations() {
  const platforms = [
    { name: 'TikTok' },
    { name: 'Meta' },
    { name: 'YouTube' },
    { name: 'Snapchat' },
    { name: 'Pinterest' },
  ];

  return (
    <section id="integrations" className="py-20 px-6 bg-linear-bg">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="mb-4 text-balance">Works with your platforms</h2>
          <p className="text-lg text-text-secondary text-balance max-w-2xl mx-auto">
            Seamlessly integrate with all major social networks
          </p>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-6 max-w-4xl mx-auto">
          {platforms.map((platform, index) => (
            <div
              key={index}
              className="group px-5 py-3 bg-linear-bg-secondary backdrop-blur-sm rounded-md border border-linear-border-subtle hover:border-linear-border-hover linear-transition hover:scale-105 cursor-pointer"
            >
              <div className="text-base font-medium text-text-primary">
                {platform.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
