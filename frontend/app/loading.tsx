export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col bg-brand-bg animate-pulse overflow-hidden">
      {/* Скелетон навигации (Header) */}
      <header className="w-full z-50 h-16 flex justify-between items-center px-6 md:px-12 max-w-7xl mx-auto">
        {/* Логотип */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-brand-60/40 rounded-full"></div>
          <div className="h-6 w-24 bg-brand-60/40 rounded-md hidden md:block"></div>
        </div>
        
        {/* Ссылки (десктоп) */}
        <div className="hidden lg:flex items-center gap-6 h-full">
          <div className="h-4 w-20 bg-brand-60/40 rounded"></div>
          <div className="h-4 w-16 bg-brand-60/40 rounded"></div>
          <div className="h-4 w-28 bg-brand-60/40 rounded"></div>
        </div>
      </header>

      {/* Скелетон главного экрана (Hero) */}
      <main className="flex-grow relative flex flex-col justify-center px-6 md:px-12 pt-24 pb-24 md:pb-34">
        <div className="relative z-10 max-w-7xl mx-auto w-full flex-grow flex flex-col justify-center">
          <div className="max-w-3xl">
            {/* Заголовок */}
            <div className="h-14 md:h-20 bg-brand-60/40 rounded-2xl w-4/5 mb-4"></div>
            <div className="h-14 md:h-20 bg-brand-60/40 rounded-2xl w-3/5 mb-8"></div>
            {/* Подзаголовок */}
            <div className="h-6 bg-brand-60/40 rounded-lg w-2/3 mb-3"></div>
            <div className="h-6 bg-brand-60/40 rounded-lg w-1/2"></div>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto w-full mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Скелетоны карточек сервисов (StatCard) */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[120px] bg-brand-60/40 rounded-2xl border border-brand-10/5"></div>
          ))}
        </div>
      </main>
    </div>
  );
}