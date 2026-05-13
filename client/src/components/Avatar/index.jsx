import React, { useEffect, useState } from 'react';

export default function Avatar({ src, name = 'User', className = 'message-avatar', title }) {
  const [failed, setFailed] = useState(false);
  const initial = name?.charAt(0)?.toUpperCase() || 'U';
  const showImage = Boolean(src) && !failed;

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <div className={className} title={title}>
      {showImage ? (
        <img
          src={src}
          alt={name}
          onError={() => setFailed(true)}
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}
