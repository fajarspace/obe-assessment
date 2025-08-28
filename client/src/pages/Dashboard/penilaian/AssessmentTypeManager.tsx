import React, { useState, useEffect } from "react";
import { Modal, Input, Button, List, Tag, Space, message, Alert } from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  CommentOutlined,
} from "@ant-design/icons";

const { TextArea } = Input;

interface AssessmentTypeWithComment {
  name: string;
  comment?: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  assessmentTypes: string[];
  onUpdateAssessmentTypes: (
    types: string[],
    comments?: Record<string, string>
  ) => void;
}

export const AssessmentTypesManager: React.FC<Props> = ({
  visible,
  onClose,
  assessmentTypes,
  onUpdateAssessmentTypes,
}) => {
  const [localTypes, setLocalTypes] = useState<AssessmentTypeWithComment[]>([]);
  const [newType, setNewType] = useState("");
  const [newComment, setNewComment] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [editingComment, setEditingComment] = useState("");

  // Initialize local types with comments when component mounts or assessmentTypes change
  useEffect(() => {
    const typesWithComments = assessmentTypes.map((type) => ({
      name: type,
      comment: "", // Load from saved data if available
    }));
    setLocalTypes(typesWithComments);
  }, [assessmentTypes]);

  const handleAddType = () => {
    if (!newType.trim()) {
      message.error("Nama assessment type tidak boleh kosong");
      return;
    }

    const normalizedType = newType.trim().toLowerCase();
    if (localTypes.some((item) => item.name === normalizedType)) {
      message.error("Assessment type sudah ada");
      return;
    }

    setLocalTypes([
      ...localTypes,
      {
        name: normalizedType,
        comment: newComment.trim() || "",
      },
    ]);
    setNewType("");
    setNewComment("");
    message.success("Assessment type berhasil ditambahkan");
  };

  const handleDeleteType = (index: number) => {
    const newTypes = localTypes.filter((_, i) => i !== index);
    setLocalTypes(newTypes);
    message.success("Assessment type berhasil dihapus");
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditingValue(localTypes[index].name);
    setEditingComment(localTypes[index].comment || "");
  };

  const handleSaveEdit = () => {
    if (!editingValue.trim()) {
      message.error("Nama assessment type tidak boleh kosong");
      return;
    }

    const normalizedValue = editingValue.trim().toLowerCase();
    if (
      localTypes.some(
        (item, index) => item.name === normalizedValue && index !== editingIndex
      )
    ) {
      message.error("Assessment type sudah ada");
      return;
    }

    const newTypes = [...localTypes];
    newTypes[editingIndex!] = {
      name: normalizedValue,
      comment: editingComment.trim() || "",
    };
    setLocalTypes(newTypes);
    setEditingIndex(null);
    setEditingValue("");
    setEditingComment("");
    message.success("Assessment type berhasil diubah");
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingValue("");
    setEditingComment("");
  };

  const handleUpdateComment = (index: number, comment: string) => {
    const newTypes = [...localTypes];
    newTypes[index].comment = comment;
    setLocalTypes(newTypes);
  };

  const handleSave = () => {
    if (localTypes.length === 0) {
      message.error("Minimal harus ada 1 assessment type");
      return;
    }

    const types = localTypes.map((item) => item.name);
    const comments = localTypes.reduce((acc, item) => {
      if (item.comment) {
        acc[item.name] = item.comment;
      }
      return acc;
    }, {} as Record<string, string>);

    onUpdateAssessmentTypes(types, comments);
    onClose();
  };

  const handleCancel = () => {
    const typesWithComments = assessmentTypes.map((type) => ({
      name: type,
      comment: "",
    }));
    setLocalTypes(typesWithComments);
    setNewType("");
    setNewComment("");
    setEditingIndex(null);
    setEditingValue("");
    setEditingComment("");
    onClose();
  };

  return (
    <Modal
      title="Kelola Assessment Types"
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Batal
        </Button>,
        <Button key="save" type="primary" onClick={handleSave}>
          Simpan
        </Button>,
      ]}
      width={800}
      destroyOnClose
    >
      <div className="space-y-4">
        {/* Add New Type */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center gap-2 mb-3">
            <PlusOutlined />
            <span className="font-medium">Tambah Assessment Type Baru</span>
          </div>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Nama assessment type (misal: tugas, kuis, projek)"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                onPressEnter={handleAddType}
                style={{ flex: 1 }}
              />
              <Button
                type="primary"
                onClick={handleAddType}
                icon={<PlusOutlined />}
              >
                Tambah
              </Button>
            </div>
            <TextArea
              placeholder="Komentar/deskripsi untuk assessment type ini (opsional)"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={2}
              maxLength={200}
              showCount
            />
          </div>
        </div>

        {/* Current Types */}
        <div>
          <h4 className="font-medium mb-3">
            Assessment Types Aktif ({localTypes.length})
          </h4>
          <List
            bordered
            dataSource={localTypes}
            renderItem={(item, index) => (
              <List.Item>
                <div className="w-full space-y-2">
                  {editingIndex === index ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Input
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onPressEnter={handleSaveEdit}
                          size="small"
                          style={{ width: "200px" }}
                        />
                        <Button
                          type="primary"
                          size="small"
                          icon={<CheckOutlined />}
                          onClick={handleSaveEdit}
                        />
                        <Button
                          size="small"
                          icon={<CloseOutlined />}
                          onClick={handleCancelEdit}
                        />
                      </div>
                      <TextArea
                        value={editingComment}
                        onChange={(e) => setEditingComment(e.target.value)}
                        placeholder="Komentar/deskripsi"
                        rows={2}
                        maxLength={200}
                        showCount
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Tag color="blue" className="capitalize">
                            {item.name}
                          </Tag>
                          <span className="text-sm text-gray-500">
                            #{index + 1}
                          </span>
                          {item.comment && (
                            <CommentOutlined className="text-blue-500" />
                          )}
                        </div>
                        <Space>
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleStartEdit(index)}
                          />
                          <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDeleteType(index)}
                            disabled={localTypes.length === 1}
                          />
                        </Space>
                      </div>
                      {item.comment && (
                        <div className="mt-2">
                          <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                            <CommentOutlined className="mr-1" />
                            {item.comment}
                          </div>
                        </div>
                      )}
                      {!item.comment && editingIndex !== index && (
                        <div className="mt-2">
                          <TextArea
                            placeholder="Tambahkan komentar/deskripsi..."
                            value=""
                            onChange={(e) =>
                              handleUpdateComment(index, e.target.value)
                            }
                            rows={1}
                            maxLength={200}
                            className="text-xs"
                            onBlur={(e) => {
                              if (e.target.value.trim()) {
                                handleUpdateComment(
                                  index,
                                  e.target.value.trim()
                                );
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </List.Item>
            )}
            locale={{ emptyText: "Belum ada assessment type" }}
          />
        </div>

        {/* Warning for minimum types */}
        {localTypes.length === 1 && (
          <Alert
            message="Peringatan"
            description="Minimal harus ada 1 assessment type. Tombol hapus dinonaktifkan untuk item terakhir."
            type="warning"
            showIcon
          />
        )}
      </div>
    </Modal>
  );
};
