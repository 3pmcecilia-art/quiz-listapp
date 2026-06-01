export default function AddButton({ onClick, label = '+ 추가' }) {
  return (
    <button
      onClick={onClick}
      className="
        fixed bottom-6 right-6
        flex items-center gap-2
        bg-primary-600 hover:bg-primary-700 active:bg-primary-800
        text-white font-semibold text-sm
        px-5 py-3 rounded-full shadow-lg
        transition-colors duration-150
        z-20
      "
    >
      <span className="text-lg leading-none">+</span>
      <span>{label}</span>
    </button>
  )
}
