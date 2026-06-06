import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';

describe('Admin app shell', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('renders the prototype-aligned admin navigation and default content page', () => {
    render(<App />);

    expect(screen.getByText('管理员管理系统')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '内容综合管理' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '用户账号管理' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '举报版权投诉' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '分类标签管理' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '系统参数配置' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '操作审计日志' })).toBeInTheDocument();
    expect(screen.getByText('资源审核列表')).toBeInTheDocument();
    expect(screen.getByText('驳回操作需填写原因，审核通过后前台正常展示')).toBeInTheDocument();
  });

  it('renders the login page when opened on /login', () => {
    window.history.pushState({}, '', '/login');

    render(<App />);

    expect(screen.getByRole('heading', { name: '资源分享论坛' })).toBeInTheDocument();
    expect(screen.getByText('后台管理系统')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '登录后台' })).toBeInTheDocument();
  });

  it('keeps table actions available for classroom demonstration', () => {
    render(<App />);

    const resourceRow = screen.getByText('2026考研政治历年真题完整版').closest('tr');
    expect(resourceRow).not.toBeNull();
    expect(within(resourceRow as HTMLTableRowElement).getByRole('button', { name: '通过审核' })).toBeInTheDocument();
    expect(within(resourceRow as HTMLTableRowElement).getByRole('button', { name: '驳回' })).toBeInTheDocument();
  });
});
