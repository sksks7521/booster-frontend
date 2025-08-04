"use client"

import type React from "react"
import { Table } from "antd"
import type { Item } from "../../types/item"

interface ItemTableProps {
  items: Item[]
  onItemSelect: (item: Item) => void
}

const ItemTable: React.FC<ItemTableProps> = ({ items, onItemSelect }) => {
  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: Item) => (
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault()
            onItemSelect(record)
          }}
        >
          {text}
        </a>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
    },
  ]

  const rowSelection = {
    onChange: (selectedRowKeys: React.Key[], selectedRows: Item[]) => {
      if (selectedRows.length > 0) {
        onItemSelect(selectedRows[0])
      }
    },
  }

  const handleRowClick = (record: Item) => {
    onItemSelect(record)
  }

  const handleRowMouseEnter = (record: Item) => {
    // Add hover effect here if needed
  }

  const handleRowMouseLeave = (record: Item) => {
    // Remove hover effect here if needed
  }

  return (
    <Table
      columns={columns}
      dataSource={items}
      rowSelection={rowSelection}
      onRow={(record) => ({
        onClick: () => handleRowClick(record),
        onMouseEnter: () => handleRowMouseEnter(record),
        onMouseLeave: () => handleRowMouseLeave(record),
        className: "cursor-pointer",
      })}
    />
  )
}

export default ItemTable
