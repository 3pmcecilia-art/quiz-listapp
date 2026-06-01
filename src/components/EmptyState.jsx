export default function EmptyState({ type }) {
  const config = {
    sentence: {
      icon: '📝',
      title: '아직 저장된 문장 노트가 없어요.',
      sub: '"문장 추가" 버튼을 눌러 첫 문장을 추가해보세요!',
    },
    problem: {
      icon: '❓',
      title: '아직 저장된 문제 노트가 없어요.',
      sub: '"문제 추가" 버튼을 눌러 첫 문제를 추가해보세요!',
    },
  }
  const { icon, title, sub } = config[type]

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-6">
      <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center">
        <span className="text-4xl">{icon}</span>
      </div>
      <div>
        <p className="text-slate-600 font-medium">{title}</p>
        <p className="text-slate-400 text-sm mt-1">{sub}</p>
      </div>
    </div>
  )
}
