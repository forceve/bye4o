const app = document.getElementById("app") as HTMLDivElement;

const img = document.createElement("img");
img.src = "/monument.png";
img.alt = "Monument";

// 图片加载失败时的简单提示
img.onerror = () => {
  app.textContent = "图片加载失败，请确认 public/monument.png 存在。";
  app.style.display = "flex";
  app.style.alignItems = "center";
  app.style.justifyContent = "center";
  app.style.fontSize = "1.2rem";
  app.style.color = "#999";
};

app.appendChild(img);

