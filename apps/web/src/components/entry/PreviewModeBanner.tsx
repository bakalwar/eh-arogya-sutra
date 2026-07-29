export function PreviewModeBanner({ message }: { message: string }) {
  return (
    <div className="ehas2-preview-banner" role="status">
      <span aria-hidden="true">◇</span>
      <span>{message}</span>
    </div>
  );
}
