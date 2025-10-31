import React, { useEffect, useRef, useState } from 'react';

// Make TS aware of the globally loaded library
declare const Html5Qrcode: any;

interface QrScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onScanFailure?: (error: string) => void;
}

const QrScanner: React.FC<QrScannerProps> = ({ onScanSuccess, onScanFailure }) => {
    const qrReaderRef = useRef<HTMLDivElement>(null);
    const scannerInstanceRef = useRef<any>(null);
    const [status, setStatus] = useState('Initializing...');

    useEffect(() => {
        if (!qrReaderRef.current) return;

        let isCancelled = false;
        
        const startScanner = () => {
            if (typeof Html5Qrcode === 'undefined') {
                setStatus('QR Scanner Library loading...');
                setTimeout(startScanner, 100);
                return;
            }

            if (isCancelled) return;

            // The library handles permission requests internally. Let it do its job.
            const html5QrCode = new Html5Qrcode(qrReaderRef.current.id, /* verbose= */ false);
            scannerInstanceRef.current = html5QrCode;

            setStatus('Initializing camera...');
            html5QrCode.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText: string, decodedResult: any) => {
                    // success callback
                    if (scannerInstanceRef.current) {
                        scannerInstanceRef.current.stop().catch(console.warn);
                        scannerInstanceRef.current = null;
                        onScanSuccess(decodedText);
                    }
                },
                (errorMessage: string) => {
                    // This callback is for when a QR code is not found, not for errors. Ignore it.
                }
            ).then(() => {
                if (!isCancelled) setStatus('Camera ready. Point at QR code.');
            }).catch((err: any) => {
                if (isCancelled) return; // Don't show error if component unmounted.

                console.error("Scanner failed to start:", err);
                let errorMessage = 'Failed to start camera.';
                // The library throws specific error names for permission issues.
                if (String(err).includes('NotAllowedError') || String(err).includes('Permission denied')) {
                    errorMessage = 'Camera permission denied.';
                } else if (String(err).includes('NotFoundError')) {
                     errorMessage = 'No camera found.';
                }
                
                setStatus(errorMessage);
                if (onScanFailure) {
                    onScanFailure(errorMessage);
                }
            });
        };

        startScanner();

        return () => {
            isCancelled = true;
            if (scannerInstanceRef.current) {
                scannerInstanceRef.current.stop().catch((err: any) => {
                    console.warn("Error stopping scanner (ignorable):", err);
                });
                scannerInstanceRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div id="qr-reader-container" className="w-full max-w-[400px] mx-auto border-4 border-blue-500 rounded-xl overflow-hidden min-h-[250px] flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold">
            <div id="qr-reader-element" ref={qrReaderRef} className="w-full"></div>
             {status && <p className="absolute text-center p-2 bg-white/70 dark:bg-gray-900/70 dark:text-gray-200 rounded-md text-sm">{status}</p>}
        </div>
    );
};

export default QrScanner;