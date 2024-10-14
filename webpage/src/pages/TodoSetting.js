import { Routes, Route, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button, Col, DatePicker, Form, Input, Radio, Row, Select, Space } from "antd";
import {CloseOutlined} from "@ant-design/icons"
import TextArea from "antd/es/input/TextArea";
import { validateRequire } from "./EditDev";
import dayjs from 'dayjs';
import { apiDevCmd } from "../api/api";
import CmdBuilder from "./CmdBuilder";

const todoAddKey = 'todoAdd'
const paraKey = 'para'
const cycleModes = Object.freeze({
  none: 0,
  second: 1,
  minute: 2,
  hour: 3,
  week: 4,
  day: 5,
  month: 6
});

const FormListAdapterTodos = ({ params }) => {
  const { fields, operation, errors, getDatas, dev } = params
  const [isEdit, setIsEdit] = useState(false)
  const getValues = () => {
    const values = getDatas()
    return values.length == 0 ? { value: '無資料', style: { border: '1px red solid' } } : { value: JSON.stringify(values) }
  }
  const format = md=>{
    if(md == 0)return "YYYY-MM-DD HH:mm:ss"
    if(md == 1)return "ss"
    if(md == 2)return "mm:ss"
    if(md == 3)return "HH:mm:ss"
    if(md == 4)return "HH:mm:ss dddd"
    if(md == 5)return "DD HH:mm:ss"
    if(md == 6)return "MM-DD HH:mm:ss"
  }
  return <>
    <Form.Item noStyle>
      <Row justify={isEdit ? 'end' : 'space-between'} align='middle' wrap={false}>
        <Col flex={!isEdit ? 'auto' : ''}>{isEdit ? <Button type="dashed" onClick={() => operation.add()}>新增項目</Button> : <Input disabled {...getValues()} />}</Col>
        <Col><Button type="dashed" onClick={() => setIsEdit(!isEdit)}>{isEdit ? '結束編輯' : '編輯'}</Button></Col>
      </Row>
    </Form.Item>
    {isEdit && fields.map((field, index) => (
      <Form.Item key={field.key} noStyle>
        <Row justify='space-between' wrap={false}>
          <Col flex='auto'>
            <Form.Item key={field.key} {...field} name={[field.name, 'md']} rules={[validateRequire]} hasFeedback={true} style={{ marginBottom: 0 }} 
            ><Select
                options={[
                  { label: '無', value: 0 },
                  { label: '秒', value: 1 },
                  { label: '分', value: 2 },
                  { label: '時', value: 3 },
                  { label: '周', value: 4 },
                  { label: '日', value: 5 },
                  { label: '月', value: 6 },
                ]}
              /></Form.Item>
          </Col>
          <Col flex='auto'>
            <Form.Item shouldUpdate={(prevValues, currentValues) => {
              return prevValues.todoAdd.length == currentValues.todoAdd && prevValues.todoAdd[field.key].md != currentValues.todoAdd[field.key].md
            }}>{
                ({ getFieldValue }) => <Form.Item {...field} name={[field.name, 't']} rules={[validateRequire]} hasFeedback={true} style={{ marginBottom: 0 }}>
                  <DatePicker showTime format={format(getFieldValue([todoAddKey, field.key, 'md']))} />
                </Form.Item>
              }</Form.Item>
          </Col>
          <Col flex='auto'>
            <Form.Item {...field} name={[field.name, 'cmd']} valuePropName="cmds" rules={[validateRequire]} hasFeedback={true} style={{ marginBottom: 0 }}><CmdBuilder dev={dev}/></Form.Item>
          </Col>
          <Col flex='none'>
            <Button type="dashed" onClick={() => operation.remove(field.name)}>移除</Button>
          </Col>
        </Row>
      </Form.Item>
    ))}
  </>
}

const FormListAdapterParas = ({ params }) => {
  const { fields, operation, errors, getDatas } = params
  return <>
    {fields.map((field, index) => (
      <Form.Item key={field.key} noStyle>
        <Row justify='space-between' wrap={false}>
          <Col flex='none'>
            <Form.Item {...field} name={[field.name, 'name']} style={{ marginBottom: 0 }}>
              <Input readOnly type=""/>
            </Form.Item>
          </Col>
          <Col flex='auto'>
            <Form.Item {...field} name={[field.name, 'fb']} rules={[validateRequire]} hasFeedback={true} style={{ marginBottom: 0 }}>
              <Input style={{minWidth:100}}/>
            </Form.Item>
          </Col>
        </Row>
      </Form.Item>
    ))}
  </>
}

export default function ({ data, onClose }) {
  const dev = data
  const todos = data.cmds.todoGet == null?[]:data.cmds.todoGet
  const paras = data.cmds.getParameter
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    const todoAdd = values[todoAddKey].map(td=>{return{
      ...td,
      t:td.t.unix(),
      cmd:JSON.parse(td.cmd)
    }})
    const setParameter = values[paraKey].map(p=>{return{
      name:p.name,
      value:p.fb
    }})
    const cmd = {
      ip: dev.ip,
      port: dev.port,
      cmds: {todoClear:null, todoAdd,setParameter}
    }
    await apiDevCmd(cmd).then(e=>{
      console.log('todoAdd-suc',e.data.data)
      onClose()
    }).catch(e=>console.error('todoAdd-err',e))
  }
  const clear = () =>{
    const cmd = {
      ip: dev.ip,
      port: dev.port,
      cmds: {todoClear:null}
    }

    apiDevCmd(cmd).then(e=>{
      console.log('todoClear-suc',e.data.data)
      onClose()
    }).catch(e=>console.error('todoClear-err',e))
  }
  const getDatas =  key => () => form.getFieldValue(key)?.filter(c => c != undefined && c != '')
  return (  
    <>
      <div>
        {dev.ip}
      </div>
      <h2>TodoSetting</h2>
      <Form form={form} labelCol={{ span: 4 }} wrapperCol={{ span: 20 }} layout="horizontal" onFinish={onFinish}>
        <Form.Item label="Todos">
          <Form.List name={todoAddKey} initialValue={todos.map(td=>{
            return {
              ...td,
              t:dayjs.unix(td.t),
              cmd:JSON.stringify(td.cmd)
            }})}>
            {(fields, operation, errors) => <FormListAdapterTodos params={{ fields, operation, errors, getDatas: getDatas(todoAddKey), dev:dev }} />}
          </Form.List>
        </Form.Item>

        <Form.Item label="Paras">
          <Form.List name={paraKey} initialValue={paras}>
            {(fields, operation, errors) => <FormListAdapterParas params={{ fields, operation, errors, getDatas: getDatas(paraKey) }} />}
          </Form.List>
        </Form.Item>
        

        <Form.Item wrapperCol>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={clear}>清空</Button>
            <Button style={{ marginRight: 20 }} onClick={onClose}>取消</Button>
            <Button htmlType="submit">儲存</Button>
          </div>
        </Form.Item>
      </Form>
    </>
  );
}