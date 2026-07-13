import PlatformRows from '../components/PlatformRows.jsx'
import { useApp } from '../store.jsx'

export default function TrendingScreen({ onOpenDetail }) {
  const { t } = useApp()
  return (
    <main className="mt-20 px-margin-mobile md:px-margin-desktop max-w-[1440px] mx-auto pb-16">
      <section className="py-lg">
        <h2 className="text-headline-lg md:text-headline-xl text-on-surface">{t('navTrending')}</h2>
        <p className="text-body-lg text-on-surface-variant">{t('trendingSub')}</p>
      </section>
      <PlatformRows onOpenDetail={onOpenDetail} />
    </main>
  )
}
