import { useState, useEffect, useCallback } from "react";
import {
    fetchCategories, createCategory, renameCategory, deleteCategory,
    fetchEntries, deleteEntry,
} from "../../lib/api/passwordsClient";
import type { PasswordCategory, PasswordEntry } from "../../lib/api/passwordsClient";
import EntryModal from "./components/EntryModal/EntryModal";
import { useToast } from "../../contexts/ToastContext";
import { useConfirm } from "../../contexts/ConfirmContext";
import "./Passwords.css";

function Passwords() {
    const { showToast } = useToast();
    const confirm = useConfirm();

    const [categories, setCategories] = useState<PasswordCategory[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [entries, setEntries] = useState<PasswordEntry[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [loadingEntries, setLoadingEntries] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [addingCategory, setAddingCategory] = useState(false);
    const [renamingCategoryId, setRenamingCategoryId] = useState<number | null>(null);
    const [renameValue, setRenameValue] = useState("");
    const [revealedEntryId, setRevealedEntryId] = useState<number | null>(null);
    const [entryModal, setEntryModal] = useState<{ mode: "add" | "edit"; entry?: PasswordEntry } | null>(null);

    const loadCategories = useCallback(async () => {
        setLoadingCategories(true);
        try {
            const cats = await fetchCategories();
            setCategories(cats);
            if (cats.length > 0 && selectedCategoryId === null) {
                setSelectedCategoryId(cats[0].id);
            }
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to load categories.", "error");
        } finally {
            setLoadingCategories(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    const loadEntries = useCallback(async (categoryId: number) => {
        setLoadingEntries(true);
        try {
            const list = await fetchEntries(categoryId);
            setEntries(list);
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to load entries.", "error");
        } finally {
            setLoadingEntries(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (selectedCategoryId !== null) {
            loadEntries(selectedCategoryId);
        } else {
            setEntries([]);
        }
    }, [selectedCategoryId, loadEntries]);

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        try {
            const created = await createCategory(newCategoryName.trim());
            setNewCategoryName("");
            setAddingCategory(false);
            await loadCategories();
            setSelectedCategoryId(created.id);
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to create category.", "error");
        }
    };

    const handleRenameCategory = async (id: number) => {
        if (!renameValue.trim()) return;
        try {
            await renameCategory(id, renameValue.trim());
            setRenamingCategoryId(null);
            await loadCategories();
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to rename category.", "error");
        }
    };

    const handleDeleteCategory = async (category: PasswordCategory) => {
        const warning = category.entry_count > 0
            ? `Delete "${category.name}" and all ${category.entry_count} entr${category.entry_count === 1 ? "y" : "ies"} inside it? This can't be undone.`
            : `Delete "${category.name}"?`;
        const confirmed = await confirm(warning, "Delete Category");
        if (!confirmed) return;

        try {
            await deleteCategory(category.id);
            showToast("Category deleted");
            if (selectedCategoryId === category.id) setSelectedCategoryId(null);
            await loadCategories();
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to delete category.", "error");
        }
    };

    const handleDeleteEntry = async (entry: PasswordEntry) => {
        const confirmed = await confirm(`Delete "${entry.title}"?`, "Delete Entry");
        if (!confirmed) return;

        try {
            await deleteEntry(entry.id);
            showToast("Entry deleted");
            if (selectedCategoryId !== null) await loadEntries(selectedCategoryId);
            await loadCategories();
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to delete entry.", "error");
        }
    };

    const handleCopy = async (value: string | null, label: string) => {
        if (!value) return;
        try {
            await navigator.clipboard.writeText(value);
            showToast(`${label} copied`);
        } catch {
            showToast("Couldn't copy to clipboard", "error");
        }
    };

    const selectedCategory = categories.find((c) => c.id === selectedCategoryId) || null;

    return (
        <div className="passwords-page">
            <div className="passwords-header">
                <h1>Passwords</h1>
            </div>

            <div className="passwords-layout">
                <div className="category-sidebar card">
                    <div className="category-sidebar-title">Categories</div>

                    {loadingCategories && <p className="empty-text">Loading...</p>}
                    {!loadingCategories && categories.length === 0 && (
                        <p className="empty-text">No categories yet.</p>
                    )}

                    <div className="category-list">
                        {categories.map((cat) => (
                            <div key={cat.id} className={cat.id === selectedCategoryId ? "category-item active" : "category-item"}>
                                {renamingCategoryId === cat.id ? (
                                    <input
                                        type="text"
                                        className="category-rename-input"
                                        value={renameValue}
                                        autoFocus
                                        onChange={(e) => setRenameValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleRenameCategory(cat.id);
                                            if (e.key === "Escape") setRenamingCategoryId(null);
                                        }}
                                        onBlur={() => handleRenameCategory(cat.id)}
                                    />
                                ) : (
                                    <button
                                        type="button"
                                        className="category-button"
                                        onClick={() => setSelectedCategoryId(cat.id)}
                                        onDoubleClick={() => {
                                            setRenamingCategoryId(cat.id);
                                            setRenameValue(cat.name);
                                        }}
                                    >
                                        <span className="category-name">{cat.name}</span>
                                        <span className="category-count">{cat.entry_count}</span>
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className="category-delete-button"
                                    onClick={() => handleDeleteCategory(cat)}
                                    title="Delete category"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>

                    {addingCategory ? (
                        <div className="category-add-row">
                            <input
                                type="text"
                                placeholder="Category name"
                                value={newCategoryName}
                                autoFocus
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleAddCategory();
                                    if (e.key === "Escape") setAddingCategory(false);
                                }}
                            />
                            <button type="button" className="btn-compact" onClick={handleAddCategory}>Add</button>
                        </div>
                    ) : (
                        <button type="button" className="category-add-button" onClick={() => setAddingCategory(true)}>
                            + New Category
                        </button>
                    )}
                </div>

                <div className="entries-panel card">
                    {!selectedCategory && (
                        <p className="empty-text">Select or create a category to see its entries.</p>
                    )}

                    {selectedCategory && (
                        <>
                            <div className="entries-header">
                                <h2>{selectedCategory.name}</h2>
                                <button type="button" onClick={() => setEntryModal({ mode: "add" })}>
                                    + New Entry
                                </button>
                            </div>

                            {loadingEntries && <p className="empty-text">Loading...</p>}
                            {!loadingEntries && entries.length === 0 && (
                                <p className="empty-text">No entries in this category yet.</p>
                            )}

                            {!loadingEntries && entries.length > 0 && (
                                <table className="entries-table">
                                    <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Username</th>
                                            <th>Password</th>
                                            <th>URL</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {entries.map((entry) => (
                                            <tr key={entry.id}>
                                                <td>{entry.title}</td>
                                                <td>
                                                    {entry.username || "—"}
                                                    {entry.username && (
                                                        <button
                                                            type="button"
                                                            className="inline-copy-button"
                                                            onClick={() => handleCopy(entry.username, "Username")}
                                                        >
                                                            Copy
                                                        </button>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className="password-mask">
                                                        {revealedEntryId === entry.id ? (entry.password || "—") : "••••••••"}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className="inline-copy-button"
                                                        onClick={() => setRevealedEntryId(revealedEntryId === entry.id ? null : entry.id)}
                                                    >
                                                        {revealedEntryId === entry.id ? "Hide" : "Show"}
                                                    </button>
                                                    {entry.password && (
                                                        <button
                                                            type="button"
                                                            className="inline-copy-button"
                                                            onClick={() => handleCopy(entry.password, "Password")}
                                                        >
                                                            Copy
                                                        </button>
                                                    )}
                                                </td>
                                                <td>
                                                    {entry.url ? (
                                                        <a href={entry.url} target="_blank" rel="noreferrer">{entry.url}</a>
                                                    ) : "—"}
                                                </td>
                                                <td className="actions-cell">
                                                    <button
                                                        type="button"
                                                        className="btn-compact"
                                                        onClick={() => setEntryModal({ mode: "edit", entry })}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn-compact btn-danger"
                                                        onClick={() => handleDeleteEntry(entry)}
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </>
                    )}
                </div>
            </div>

            {entryModal && selectedCategoryId !== null && (
                <EntryModal
                    mode={entryModal.mode}
                    categoryId={selectedCategoryId}
                    entry={entryModal.entry}
                    onClose={() => setEntryModal(null)}
                    onSaved={() => {
                        showToast(entryModal.mode === "add" ? "Entry created" : "Entry updated");
                        if (selectedCategoryId !== null) loadEntries(selectedCategoryId);
                        loadCategories();
                    }}
                />
            )}
        </div>
    );
}

export default Passwords;