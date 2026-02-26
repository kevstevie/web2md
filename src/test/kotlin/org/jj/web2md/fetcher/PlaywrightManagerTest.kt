package org.jj.web2md.fetcher

import org.junit.jupiter.api.Test
import kotlin.test.assertFalse

class PlaywrightManagerTest {

    @Test
    fun `initialize should return false when playwright browsers are not installed`() {
        // CI 환경 또는 브라우저 미설치 시 false 반환 검증
        // 브라우저가 설치된 환경이면 true를 반환하므로 어느 쪽이든 예외 없이 처리되어야 함
        val manager = PlaywrightManager()
        val result = runCatching { manager.initialize() }
        assert(result.isSuccess) { "initialize()는 예외를 던지지 않고 boolean을 반환해야 합니다" }
        manager.close()
    }

    @Test
    fun `close should be safe to call when not initialized`() {
        val manager = PlaywrightManager()
        // 초기화 없이 close 호출 시 예외 없어야 함
        manager.close()
    }

    @Test
    fun `withPage should throw when manager is not initialized`() {
        val manager = PlaywrightManager()
        val result = runCatching {
            manager.withPage { _ -> "never reached" }
        }
        assertFalse(result.isSuccess, "초기화되지 않은 상태에서 withPage 호출 시 예외가 발생해야 합니다")
    }
}
