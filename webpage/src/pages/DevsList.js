import React, { useContext, useEffect, useRef, useState } from 'react';
import { Button, Form, Input, message, Popconfirm, Table } from 'antd';
import EditDev from './EditDev';
import { apiDevCmd, apiDevGet, apiDevRemove } from '../api/api';
import TodoSetting from './TodoSetting';
const EditableContext = React.createContext(null);
const EditableRow = ({ index, ...props }) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};
const EditableCell = ({
  title,
  editable,
  children,
  dataIndex,
  record,
  handleSave,
  ...restProps
}) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef(null);
  const form = useContext(EditableContext);
  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);
  const toggleEdit = () => {
    setEditing(!editing);
    form.setFieldsValue({
      [dataIndex]: record[dataIndex],
    });
  };
  const save = async () => {
    try {
      const values = await form.validateFields();
      toggleEdit();
      handleSave({
        ...record,
        ...values,
      });
    } catch (errInfo) {
      console.log('Save failed:', errInfo);
    }
  };
  let childNode = children;
  if (editable) {
    childNode = editing ? (
      <Form.Item
        style={{
          margin: 0,
        }}
        name={dataIndex}
        rules={[
          {
            required: true,
            message: `${title} is required.`,
          },
        ]}
      >
        <Input ref={inputRef} onPressEnter={save} onBlur={save} />
      </Form.Item>
    ) : (
      <div
        className="editable-cell-value-wrap"
        style={{
          paddingInlineEnd: 24,
        }}
        onClick={toggleEdit}
      >
        {children}
      </div>
    );
  }
  return <td {...restProps}>{childNode}</td>;
};
export default function () {
  const [devs, setDevs] = useState([])
  const [editData, setEditData] = useState();
  const [devTodo, setDevTodo] = useState();
  
  useEffect(() => {
    apiDevGet().then(e=>{
      setDevs(e.data.data)
    })
  }, [editData])
  const handleDelete = _id => {
    console.log('del',_id)
    apiDevRemove(_id).then(e=>{
      apiDevGet().then(e=>{
        setDevs(e.data.data)
        message.success({
          type: 'success',
          content: '刪除成功!'
        })
      })
    })
  };
  const defaultColumns = [
    {
      title: 'desc',
      dataIndex: 'desc'
    },
    {
      title: 'edit',
      dataIndex: 'edit',
      render: (_, record) =>
        <>
          <Button 
            onClick={()=>setEditData(record)}
            size="large" 
          >
          編輯
          </Button>
        </>,
    },
    {
      title: 'todos',
      dataIndex: 'todos',
      render: (_, record) =>
        devs.length >= 1 ? <a onClick={() => {
          const cmd = {
            ip: record.ip,
            port: record.port,
            cmds: { 
              todoGet: null,
              getParameter: [{name:"ssid"},{name:"password"}] 
            }
          }
          apiDevCmd(cmd).then(e => {
            const dev = e.data.data
            dev.cmds = {...dev.cmds,...record.cmds}
            setDevTodo(dev)
          }).catch(e => console.error('todoGet-err', e))

        }}>Todos</a> : null,
    },
    {
      title: 'operation',
      dataIndex: 'operation',
      render: (_, record) =>
        devs.length >= 1 ? (
          <Popconfirm title="Sure to delete?" onConfirm={() => handleDelete(record._id)}>
            <a>Delete</a>
          </Popconfirm>
        ) : null,
    },
  ];
  const handleAdd = () => {
    setEditData({ip:null,port:null,cmds:{getPinValue:[]}})
  };
  const handleSave = (row) => {
    const newData = [...devs];
    const index = newData.findIndex((item) => row.key === item.key);
    const item = newData[index];
    newData.splice(index, 1, {
      ...item,
      ...row,
    })
  };
  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  };
  const columns = defaultColumns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record) => ({
        record,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        handleSave,
      }),
    };
  });
  return (<>
    {editData == undefined?
    devTodo == undefined?
    <>
      <Button
        onClick={()=>handleAdd()}
        type="primary"
        style={{
          marginBottom: 16,
        }}
      >
        Add a row
      </Button>
      <Table
        components={components}
        rowClassName={() => 'editable-row'}
        bordered
        dataSource={devs.map((d,i)=>{return{...d, key:i}})}
        columns={columns}
      />
    </> :
    <TodoSetting data = {devTodo} onClose={()=>setDevTodo(undefined)}/>:
    <EditDev data={editData} onClose={()=>setEditData(undefined)} />}
  </>);
}