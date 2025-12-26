import os, shutil, subprocess
from graphviz import Digraph

def ensure_graphviz_on_path():
    dot = shutil.which('dot')
    if dot:
        return dot
    candidates = [
        r"C:\Program Files\Graphviz\bin\dot.exe",
        r"C:\Program Files (x86)\Graphviz\bin\dot.exe"
    ]
    for c in candidates:
        if os.path.exists(c):
            os.environ['PATH'] = os.environ['PATH'] + ';' + os.path.dirname(c)
            return c
    return None

def main():
    out_dir = r'd:\irrigate\docs'
    os.makedirs(out_dir, exist_ok=True)

    # 创建 OBS 图
    obs = Digraph('OBS', format='png')
    obs.attr(rankdir='TB', dpi='150')  # TB = Top to Bottom (自上而下)
    
    # 设置节点样式
    obs.attr('node', shape='box', style='filled', fillcolor='lightblue', fontname='Microsoft YaHei', fontsize='12')
    
    # 1. 顶层：项目经理
    obs.node('PM', '项目经理\n(许海峰)')

    # 2. 中间层：各职能小组
    obs.attr('node', fillcolor='lightyellow')
    obs.node('G1', '前端开发组')
    obs.node('G2', '移动端开发组')
    obs.node('G3', '测试与文档组')

    # 3. 底层：具体成员
    obs.attr('node', fillcolor='white', shape='ellipse')
    obs.node('M1', '许海峰 (组长)\n桑一凡')
    obs.node('M2', '农豪进 (组长)')
    obs.node('M3', '桑一凡 (组长)\n农豪进')

    # 建立层级关系
    obs.edge('PM', 'G1')
    obs.edge('PM', 'G2')
    obs.edge('PM', 'G3')

    obs.edge('G1', 'M1')
    obs.edge('G2', 'M2')
    obs.edge('G3', 'M3')

    # 输出文件路径
    obs_base = os.path.join(out_dir, 'obs_chart')
    dot_exe = ensure_graphviz_on_path()
    
    try:
        obs.render(filename=obs_base, cleanup=True)
        print('OBS Chart PNG:', obs_base + '.png')
    except Exception as e:
        print('OBS 渲染失败:', e)
        # 备用方案：生成 DOT 文件并尝试手动调用
        with open(obs_base + '.dot', 'w', encoding='utf-8') as f:
            f.write(obs.source)
        print('已输出 DOT 文件:', obs_base + '.dot')
        
        if dot_exe and os.path.exists(dot_exe):
            try:
                subprocess.check_call([dot_exe, "-Tpng", obs_base + ".dot", "-o", obs_base + ".png"])
                print('OBS Chart PNG (备用):', obs_base + '.png')
            except Exception as e2:
                print('备用渲染也失败了:', e2)

if __name__ == '__main__':
    main()