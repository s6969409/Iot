import { useEffect, useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { Button, Checkbox, Col, Form, Input, message, Row } from "antd";
import { apiDevAdd, apiDevUpdate, sleep } from "../api/api";

export const validateRequire = {validator:(sender, value) => {
  if (typeof(value)!='boolean' && value.toString() === "") return Promise.reject('此欄位必填!');
  return Promise.resolve();
},required:true}

const validateArray = {
  validator: (sender, value) => {
    if (Array.isArray(value) && value.length == 0) return Promise.reject('此欄位不可為空白')
    return Promise.resolve()
  }, required: true
}

export const validateNumber = {
  validator: (sender, value) => {
    if (/^\d+$/.test(value) && Number(value) >= 0) return Promise.resolve()
      return Promise.reject('此欄位為正整數')
  }, required: true
}

const FormListAdapter = ({ params }) => {
  const { fields, operation, errors, getDatas, label } = params
  const [isEdit, setIsEdit] = useState(false)
  const getValues = () => {
    const values = getDatas()?.join(',')
    return values == '' ? {value:'無資料', style:{border:'1px red solid'}} : {value: values}
  }
  return <>
    <Form.Item label={label} noStyle>
      <Row justify={isEdit?'end':'space-between'} align='middle' wrap={false}>
        <Col flex={!isEdit?'auto':''}>{isEdit? <Button type="dashed" onClick={() => operation.add({ Inv: false })}>新增項目</Button> : <Input disabled {...getValues()}/>}</Col>
        <Col><Button type="dashed" onClick={() => setIsEdit(!isEdit)}>{isEdit ? '結束編輯' : '編輯'}</Button></Col>
      </Row>
    </Form.Item>
    {isEdit && fields.map((field, index) => (
      <Form.Item key={field.key} noStyle>
        <Row justify='space-between' wrap={false}>
          <Col flex='auto'>
            <Form.Item {...field} name={[field.name, 'pin']} rules={[validateRequire, validateNumber]} hasFeedback={true} style={{ marginBottom: 0 }} getValueFromEvent={e => {
              const value = e.target.value;
              return value ? parseInt(value, 10) : 0}}
            ><Input /></Form.Item>
          </Col>
          <Col flex='auto'>
            <Form.Item {...field} name={[field.name, 'comment']} rules={[validateRequire]} hasFeedback={true} style={{marginBottom:0}}><Input /></Form.Item>
          </Col>
          <Col flex='auto'>
            <Form.Item {...field} name={[field.name, 'Inv']} valuePropName={'checked'} rules={[validateRequire]} hasFeedback={true} style={{marginBottom:0}}><Checkbox >Inv</Checkbox></Form.Item>
          </Col>
          <Col flex='none'>
            <Button type="dashed" onClick={() => operation.remove(field.name)}>移除</Button>
          </Col>
        </Row>
      </Form.Item>
    ))}
  </>
}

export default function ({ data, onClose }) {
  const isAdd = data.ip == undefined
  const [form] = Form.useForm();
  const onFinish = async (values) => {
    if(isAdd){
      apiDevAdd(values).then(suc=>{
        message.success({
          type: 'success',
          content: '新增成功!'
        })
        onClose()
      }).catch(err=>{
        console.log('errA',err)
      })
    }
    else{
      apiDevUpdate(values).then(suc=>{
        message.success({
          type: 'success',
          content: '更新成功!'
        })
        onClose()
      }).catch(err=>{
        console.log('errU',err)
      })
    }

    
  }
  const getDatas = () => form.getFieldValue('getPinValue')?.filter(c => c != undefined && c != '')

  return (
    <>
      <h2>Device info</h2>
      <Form form={form} labelCol={{ span: 4 }} wrapperCol={{ span: 20 }} layout="horizontal" onFinish={onFinish} initialValues={data}>
        <Form.Item label="_id" name="_id" initialValue={data._id}>
          <Input readOnly/>
        </Form.Item>
        <Form.Item label="mac" name="mac" initialValue={data.mac}>
          <Input />
        </Form.Item>
        <Form.Item label="desc" name="desc" initialValue={data.desc} rules={[validateRequire]} hasFeedback={true}>
          <Input />
        </Form.Item>
        <Form.Item label="ip" name="ip" initialValue={data.ip} rules={[validateRequire]} hasFeedback={true}>
          <Input />
        </Form.Item>
        <Form.Item label="port" name="port" initialValue={data.port} rules={[validateRequire]} hasFeedback={true}>
          <Input type="number" />
        </Form.Item>

        <Form.Item label="IO">
          <Form.List name={['cmds', 'getPinValue']} initialValue={data.cmds.getPinValue}>
            {(fields, operation, errors) => <FormListAdapter params={{ fields, operation, errors, getDatas: getDatas }} />}
          </Form.List>
        </Form.Item>

        <Form.Item wrapperCol>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button style={{ marginRight: 20 }} onClick={onClose}>取消</Button>
            <Button htmlType="submit">儲存</Button>
          </div>
        </Form.Item>
      </Form>
      <Link to="/">Main</Link>
    </>
  )
}