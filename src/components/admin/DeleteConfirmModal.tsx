interface DeleteConfirmModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    userName: string
}

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, userName }: DeleteConfirmModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--overlay)] backdrop-blur-sm">
            <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md">
                <div className="p-6">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                        <i className="fas fa-exclamation-triangle text-3xl text-red-600 dark:text-red-400"></i>
                    </div>

                    <h2 className="text-2xl font-bold text-center text-foreground mb-2">
                        Xác nhận xóa người dùng
                    </h2>

                    <p className="text-center text-muted-foreground mb-6">
                        Bạn có chắc chắn muốn xóa người dùng <span className="font-semibold text-foreground">{userName}</span>?
                        <br />
                        Hành động này không thể hoàn tác.
                    </p>

                    <div className="flex gap-3">
                        <button onClick={onClose} className="btn-secondary flex-1">
                            Hủy
                        </button>
                        <button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex-1">
                            Xóa
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
