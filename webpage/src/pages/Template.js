import React from 'react';
import { UploadOutlined, UserOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { Layout, Menu, theme } from 'antd';
import { Outlet, useNavigate } from 'react-router-dom';
const { Header, Content, Footer, Sider } = Layout;
const App = () => {
  const { token: { colorBgContainer }, } = theme.useToken();
  const naviget = useNavigate()

  const menuItems = [
    {
      key: "/",
      icon: React.createElement(UserOutlined),
      label: `Main`
    },
    {
      key: "/List",
      icon: React.createElement(UploadOutlined),
      label: `List`
    },
    {
      key: "/Todos",
      icon: React.createElement(VideoCameraOutlined),
      label: `Todos`
    },
    {
      key: "/2",
      icon: React.createElement(UploadOutlined),
      label: `Test`
    },
    {
      key: "/4",
      icon: React.createElement(UserOutlined),
      label: `4`
    }
  ]
  const menueOnSelect = ({ item, key, keyPath, selectedKeys, domEvent }) => naviget(key)
  return (
    <Layout>
      <Sider breakpoint="lg" collapsedWidth="0">
        <div className="demo-logo-vertical" />
        <Menu theme="dark" mode="inline" defaultSelectedKeys={['4']} items={menuItems} onSelect={menueOnSelect} />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer, }} />
        <Content style={{ margin: '24px 16px 0', }}>
          <div style={{ padding: 24, minHeight: 360, background: colorBgContainer, }}>
            <Outlet />
          </div>
        </Content>
        <Footer style={{ textAlign: 'center', }}>
          IOT ©2024 Created by CRA
        </Footer>
      </Layout>
    </Layout>
  );
};
export default App;