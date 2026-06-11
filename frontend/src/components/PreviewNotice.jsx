/** Pages with static demo data until backend API is wired */
export default function PreviewNotice({ children }) {
  return (
    <div
      className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-100/95"
      role="status"
    >
      <strong className="text-amber-200">डेमो पूर्वावलोकन:</strong> {children || 'यह स्क्रीन अभी सैंपल डेटा दिखाती है। जल्द API से जुड़ेगी।'}
    </div>
  );
}
