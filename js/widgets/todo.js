/* ============================================================
   todo.js — 待办 widget
   暴露 window.TodoWidget.initTodo(root)
   - 增删、勾选完成（删除线），持久化 storage
   ============================================================ */
window.TodoWidget = (function () {
  'use strict';

  const escapeHtml = window.iTabUtils.escapeHtml;

  function initTodo(root) {
    root.innerHTML =
      '<div class="widget-header"><h3>待办</h3></div>' +
      '<form class="todo-add" id="todoAdd"><input id="todoInput" placeholder="添加待办，回车保存" /></form>' +
      '<ul class="todo-list" id="todoList"></ul>';

    const listEl = root.querySelector('#todoList');
    const form = root.querySelector('#todoAdd');
    const input = root.querySelector('#todoInput');

    function render(items) {
      listEl.innerHTML = '';
      (items || []).forEach(function (t) {
        const li = document.createElement('li');
        li.className = 'todo-item' + (t.done ? ' done' : '');
        li.innerHTML =
          '<label class="todo-check">' +
          '  <input type="checkbox" ' + (t.done ? 'checked' : '') + ' />' +
          '  <span>' + escapeHtml(t.text) + '</span>' +
          '</label>' +
          '<button class="todo-del" title="删除">✕</button>';
        li.querySelector('input').addEventListener('change', function () {
          toggle(t.id);
        });
        li.querySelector('.todo-del').addEventListener('click', function () {
          remove(t.id);
        });
        listEl.appendChild(li);
      });
    }

    function load() {
      Store.get({ todos: [] }, function (d) {
        render(d.todos);
      });
    }

    function toggle(id) {
      Store.get({ todos: [] }, function (d) {
        const items = d.todos.map(function (t) {
          return t.id === id ? Object.assign({}, t, { done: !t.done }) : t;
        });
        Store.set({ todos: items });
        render(items);
      });
    }

    function remove(id) {
      Store.get({ todos: [] }, function (d) {
        const items = d.todos.filter(function (t) {
          return t.id !== id;
        });
        Store.set({ todos: items });
        render(items);
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      Store.get({ todos: [] }, function (d) {
        const items = d.todos.slice();
        items.push({
          id: 't' + Date.now() + Math.random().toString(36).slice(2, 6),
          text: text,
          done: false
        });
        Store.set({ todos: items });
        render(items);
        input.value = '';
      });
    });

    load();
    Store.onChange(function (dirty) {
      if (dirty.todos) render(dirty.todos);
    });
  }

  return { initTodo: initTodo };
})();
