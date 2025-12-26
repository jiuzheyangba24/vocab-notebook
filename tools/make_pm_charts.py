import os, shutil, subprocess
from graphviz import Digraph
import pandas as pd
import plotly.express as px
from plotly.io import defaults

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

    tasks = [
        {"id":"T1","name":"需求分析与范围界定","start":"2025-11-27","finish":"2025-11-29","duration":2,"resources":["许海峰", "农豪进", "桑一凡"]},
        {"id":"T2","name":"设计与技术方案","start":"2025-11-29","finish":"2025-12-01","duration":2,"resources":["许海峰", "桑一凡"]},
        {"id":"T3","name":"前端实现（迭代一）","start":"2025-12-01","finish":"2025-12-03","duration":2,"resources":["许海峰"]},
        {"id":"T4","name":"PWA 与离线能力完成","start":"2025-12-03","finish":"2025-12-04","duration":1,"resources":["许海峰"]},
        {"id":"T5","name":"导入/导出与错题本完善","start":"2025-12-03","finish":"2025-12-04","duration":1,"resources":["桑一凡"]},
        {"id":"T6","name":"Android 工程初始化与同步","start":"2025-12-03","finish":"2025-12-04","duration":1,"resources":["农豪进"]},
        {"id":"T7","name":"调试 APK 构建与真机验证","start":"2025-12-04","finish":"2025-12-06","duration":2,"resources":["农豪进"]},
        {"id":"T8","name":"测试与缺陷修复","start":"2025-12-06","finish":"2025-12-08","duration":2,"resources":["许海峰", "农豪进", "桑一凡"]},
        {"id":"T9","name":"部署与验收文档","start":"2025-12-08","finish":"2025-12-09","duration":1,"resources":["农豪进", "桑一凡"]},
    ]

    # 构建 AOA 网络图
    aoa = Digraph('AOA', format='png')
    aoa.attr(rankdir='LR', dpi='180')
    aoa.attr('node', shape='circle', fontsize='12')
    for i in range(1,12):
        aoa.node(str(i))

    def edge(u,v,label,real=True):
        if real:
            aoa.edge(u,v,label=label)
        else:
            aoa.edge(u,v,label=label,style='dashed',color='gray')

    edge('1','2','需求分析与范围界定（2天）')
    edge('2','3','设计与技术方案（2天）')
    edge('3','4','前端实现（迭代一）（2天）')
    edge('4','5','PWA 与离线能力完成（1天）')
    edge('4','6','导入/导出与错题本完善（1天）')
    edge('4','7','Android 工程初始化与同步（1天）')
    edge('7','8','调试 APK 构建与真机验证（2天）')
    edge('5','9','Dummy（0天）',real=False)
    edge('6','9','Dummy（0天）',real=False)
    edge('8','9','Dummy（0天）',real=False)
    edge('9','10','测试与缺陷修复（2天）')
    edge('10','11','部署与验收文档（1天）')

    aoa_base = os.path.join(out_dir,'network_aoa')
    dot_exe = ensure_graphviz_on_path()
    try:
        aoa.render(filename=aoa_base, cleanup=True)
        print('AOA PNG:', aoa_base + '.png')
    except Exception as e:
        print('AOA 渲染失败:', e)
        with open(aoa_base + '.dot','w',encoding='utf-8') as f:
            f.write(aoa.source)
        print('已输出 DOT 文件:', aoa_base + '.dot')
        if dot_exe and os.path.exists(dot_exe):
            try:
                subprocess.check_call([dot_exe, "-Tpng", aoa_base + ".dot", "-o", aoa_base + ".png"])
                print('AOA PNG(备用dot):', aoa_base + '.png')
            except Exception as e2:
                print('备用 dot 渲染失败:', e2)
                print('手动命令: dot -Tpng "{}.dot" -o "{}.png"'.format(aoa_base, aoa_base))

    # 构建甘特图
    df = pd.DataFrame([{
        'Task': t['name'],
        'Start': t['start'],
        'Finish': t['finish'],
        'Resource': '/'.join(t['resources'])
    } for t in tasks])

    defaults.default_format = "png"  # 替代已废弃的 kaleido.scope.default_format
    fig = px.timeline(df, x_start='Start', x_end='Finish', y='Task', color='Resource', title='项目甘特图（含资源）')
    fig.update_yaxes(autorange='reversed')

    gantt_html = os.path.join(out_dir,'gantt.html')
    fig.write_html(gantt_html)
    print('Gantt HTML:', gantt_html)

    try:
        gantt_png = os.path.join(out_dir,'gantt.png')
        fig.write_image(gantt_png, scale=2)
        print('Gantt PNG:', gantt_png)
    except Exception as e:
        print('PNG 导出失败:', e)
        print('请安装/升级 Kaleido 与 Plotly：python -m pip install -U "kaleido>=1.0.0" "plotly>=5.24.0"')

if __name__ == '__main__':
    main()