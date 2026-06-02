export default function Header({ titulo, subtitulo }: { titulo: string; subtitulo?: string }) {
  return (
    <div className="bg-[#1a6b3c] pt-10 pb-5 px-5 text-center">
      <h1 className="text-white text-2xl font-semibold tracking-tight">{titulo}</h1>
      {subtitulo && <p className="text-green-300 text-sm mt-0.5">{subtitulo}</p>}
    </div>
  )
}
