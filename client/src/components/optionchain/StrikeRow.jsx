function StrikeRow({ strike }) {
  return (
    <tr className="border-t border-slate-800">
      <td className="p-3 text-slate-500">—</td>
      <td className="p-3 font-medium">{strike}</td>
      <td className="p-3 text-slate-500">—</td>
    </tr>
  )
}

export default StrikeRow
